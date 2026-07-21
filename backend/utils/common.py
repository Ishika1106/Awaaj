from io import BytesIO

import requests
from bson import ObjectId
from fastapi import HTTPException
from PIL import Image


def serialize_object_id(document):
    if isinstance(document, dict):
        return {
            k: serialize_object_id(v) if isinstance(v, (dict, ObjectId)) else v
            for k, v in document.items()
        }
    if isinstance(document, ObjectId):
        return str(document)
    return document


def load_image_from_url_or_file(img_url=None, file=None):
    if bool(img_url) == bool(file):
        raise HTTPException(
            status_code=400, detail="Provide either an image URL or file, not both."
        )
    if img_url:
        return Image.open(BytesIO(requests.get(img_url).content))
    return Image.open(file.file)