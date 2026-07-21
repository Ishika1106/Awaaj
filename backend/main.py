import logging
import math
from io import BytesIO

from bson import ObjectId
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response

from backend.db import get_database, get_gridfs_bucket
from backend.logger import CustomFormatter
from backend.schema import PostInfo
from backend.utils.common import load_image_from_url_or_file, serialize_object_id
from backend.utils.regex_ptr import extract_info
from backend.utils.steganography import decode_text_from_image, encode_text_in_image
from backend.utils.text_llm import (
    decompose_user_text,
    expand_user_text,
    generate_image_options,
    reverse_geocode,
)

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
handler.setFormatter(CustomFormatter())
logger.addHandler(handler)

db = None
fs = None

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def initialize_database():
    global db, fs
    if db is None:
        db = get_database()
        fs = get_gridfs_bucket()


@app.on_event("startup")
async def startup_event():
    initialize_database()


@app.get("/")
async def root():
    return {"status": "ok", "message": "Haven API is running"}


@app.post("/text-generation")
async def get_post_and_expand_its_content(post_info: PostInfo):
    try:
        loc = post_info.location
        if isinstance(loc, dict):
            loc_str = f"{loc.get('lat', '')},{loc.get('lng', '')}"
        else:
            loc_str = str(loc)
        concatenated_text = (
            f"Name: {post_info.name}\n"
            f"Phone: {post_info.phone}\n"
            f"Location: {loc_str}\n"
            f"Duration of Abuse: {post_info.duration_of_abuse}\n"
            f"Frequency of Incidents: {post_info.frequency_of_incidents}\n"
            f"Preferred Contact Method: {post_info.preferred_contact_method}\n"
            f"Current Situation: {post_info.current_situation}\n"
            f"Culprit Description: {post_info.culprit_description}\n"
            f"Custom Text: {post_info.custom_text}\n"
        )
        expanded_text = await expand_user_text(concatenated_text)
        return {"expanded_text": expanded_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error expanding text: {e}")


@app.post("/img-generation")
async def create_image_from_prompt(data: dict):
    try:
        prompt = data.get("prompt")
        if not prompt:
            raise HTTPException(status_code=400, detail="Missing 'prompt' field.")

        if fs is None:
            raise HTTPException(
                status_code=503,
                detail="Service unavailable: database is not connected. Please try again later.",
            )

        image_options = generate_image_options(prompt, count=1)

        image_urls = []
        for image_bytes in image_options:
            image_id = fs.upload_from_stream(
                "generated.png",
                BytesIO(image_bytes),
                metadata={"prompt": prompt, "type": "generated"},
            )
            image_urls.append(f"/image/{image_id}")

        return {"images": image_urls}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating image: {e}")


@app.post("/text-decomposition")
async def decompose_text_content(data: dict):
    try:
        text = data.get("text")
        if not text:
            raise HTTPException(status_code=400, detail="Missing 'text' field.")
        decomposed_text = decompose_user_text(text)
        return {"extracted_data": extract_info(decomposed_text)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error decomposing text: {e}")


@app.post("/save-extracted-data")
async def save_extracted_data(data: dict):
    try:
        if db is None:
            raise HTTPException(status_code=503, detail="Database not available")
        lat = data.get("latitude")
        lng = data.get("longitude")
        if lat and lng and isinstance(lat, (int, float)) and isinstance(lng, (int, float)) and not math.isnan(lat) and not math.isnan(lng):
            data["location_name"] = reverse_geocode(lat, lng)
        db["admin"].insert_one(data)
        return {"status": "Data saved successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving data to database: {e}")
        raise HTTPException(status_code=500, detail=f"Error saving data: {e}")


@app.post("/encode")
async def encode_text_in_image_endpoint(
    text: str, img_url: str = None, file: UploadFile = File(None)
):
    try:
        image = load_image_from_url_or_file(img_url, file)
        encoded_image = encode_text_in_image(image, text)
        buf = BytesIO()
        encoded_image.save(buf, format="PNG")
        image_bytes = buf.getvalue()

        if fs is None:
            raise HTTPException(status_code=503, detail="Database not available")

        image_id = fs.upload_from_stream(
            "encoded.png",
            BytesIO(image_bytes),
            metadata={"type": "encoded"},
        )
        return {"encoded_image_url": f"/image/{image_id}"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error encoding text in image: {e}"
        )


@app.post("/decode")
async def decode_text_from_image_endpoint(
    img_url: str = None,
    file: UploadFile = File(None),
):
    try:
        image = load_image_from_url_or_file(img_url, file)
        return {"decoded_text": decode_text_from_image(image)}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error decoding text from image: {e}"
        )


@app.get("/image/{image_id}")
async def get_image(image_id: str):
    try:
        if fs is None:
            raise HTTPException(status_code=503, detail="Database not available")
        grid_out = fs.open_download_stream(ObjectId(image_id))
        content = grid_out.read()
        return Response(content=content, media_type="image/png")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Image not found: {e}")


@app.get("/get-admin-posts")
def get_all_posts():
    try:
        if db is None:
            raise HTTPException(status_code=503, detail="Database not available")
        posts = [serialize_object_id(post) for post in db["admin"].find()]
        return JSONResponse(content=posts)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving posts: {e}")
        return JSONResponse(content=[])


@app.get("/get-post/{post_id}")
def get_post_by_id(post_id: str):
    try:
        if db is None:
            raise HTTPException(status_code=503, detail="Database not available")
        post = db["admin"].find_one({"_id": ObjectId(post_id)})
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        return JSONResponse(content=serialize_object_id(post))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving post by ID: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving post: {e}")


@app.post("/close-issue/{issue_id}")
async def close_issue(issue_id: str):
    try:
        if db is None:
            raise HTTPException(status_code=503, detail="Database not available")

        oid = ObjectId(issue_id)
        result = db["admin"].update_one(
            {"_id": oid}, {"$set": {"status": "closed"}}
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Issue not found")

        return {"status": "Issue marked as closed"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error closing issue: {e}")
        raise HTTPException(status_code=500, detail=f"Error closing issue: {e}")


@app.delete("/delete-post/{post_id}")
async def delete_post(post_id: str):
    try:
        if db is None:
            raise HTTPException(status_code=503, detail="Database not available")
        result = db["admin"].delete_one({"_id": ObjectId(post_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Post not found")
        return {"status": "Post deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting post: {e}")
        raise HTTPException(status_code=500, detail=f"Error deleting post: {e}")
