import os
import re

import requests
from dotenv import load_dotenv
from groq import Groq

from io import BytesIO

from PIL import Image, ImageDraw, ImageFont

from backend.prompts import (
    USER_POST_TEXT_DECOMPOSITION_PROMPT,
    USER_POST_TEXT_EXPANSION_PROMPT,
)

load_dotenv()

_groq_client = None


def _get_groq_client():
    global _groq_client
    if _groq_client is None:
        _groq_client = Groq(api_key=os.getenv("GROQ_API_TOKEN"))
    return _groq_client


WORD_NUMS = {
    "zero": "0", "one": "1", "two": "2", "three": "3", "four": "4",
    "five": "5", "six": "6", "seven": "7", "eight": "8", "nine": "9", "ten": "10",
    "eleven": "11", "twelve": "12", "thirteen": "13", "fourteen": "14", "fifteen": "15",
    "sixteen": "16", "seventeen": "17", "eighteen": "18", "nineteen": "19", "twenty": "20",
    "thirty": "30", "forty": "40", "fifty": "50", "sixty": "60", "seventy": "70",
    "eighty": "80", "ninety": "90",
}

def _num_variants(digit: str) -> list:
    variants = [digit]
    for word, d in WORD_NUMS.items():
        if d == digit:
            variants.append(word)
    return variants

def _fix_units(text: str, original_data: str) -> str:
    dur = re.search(r"Duration of Abuse:\s*(\d+)\s*(months?|years?|weeks?|days?)", original_data, re.IGNORECASE)
    if dur:
        digit = dur.group(1)
        correct = dur.group(2).lower()
        plural = correct + "s" if not correct.endswith("s") else correct
        units = ["years", "year", "weeks", "week", "days", "day", "months", "month"]
        for num_pat in _num_variants(digit):
            for wrong in units:
                if wrong != plural and wrong != correct:
                    text = re.sub(
                        rf"\b{re.escape(num_pat)}\b(?:\s+\w+){0,2}\s*{wrong}\b",
                        f"{digit} {plural}",
                        text,
                        flags=re.IGNORECASE,
                    )
    return text


async def expand_user_text(user_input):
    client = _get_groq_client()
    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": USER_POST_TEXT_EXPANSION_PROMPT.format(data=user_input),
            }
        ],
        model=os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"),
    )
    raw = chat_completion.choices[0].message.content
    return _fix_units(raw, user_input)


def decompose_user_text(user_input):
    client = _get_groq_client()
    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": f"{USER_POST_TEXT_DECOMPOSITION_PROMPT}. The data is {user_input}",
            }
        ],
        model=os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"),
    )
    return chat_completion.choices[0].message.content


def _make_fallback_image(prompt: str, width: int, height: int) -> bytes:
    img = Image.new("RGB", (width, height), (45, 55, 75))
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 32)
    except Exception:
        font = ImageFont.load_default()
    lines = []
    words = prompt.split()
    line = ""
    for w in words:
        test = f"{line} {w}".strip()
        bbox = draw.textbbox((0, 0), test, font=font)
        if bbox[2] - bbox[0] > width - 40:
            lines.append(line)
            line = w
        else:
            line = test
    lines.append(line)
    y = (height - len(lines) * 40) // 2
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font)
        x = (width - (bbox[2] - bbox[0])) // 2
        draw.text((x, y), line, fill=(255, 255, 255), font=font)
        y += 40
    buf = BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def generate_image_from_prompt(
    prompt: str, width: int = 768, height: int = 768, seed: int = None
) -> bytes:
    try:
        encoded_prompt = requests.utils.quote(prompt)
        url = f"https://image.pollinations.ai/prompt/{encoded_prompt}"
        params = {"width": width, "height": height, "nologo": "true"}
        if seed is not None:
            params["seed"] = seed
        response = requests.get(url, params=params, timeout=120)
        response.raise_for_status()
        return response.content
    except Exception:
        return _make_fallback_image(prompt, width, height)


def generate_image_options(prompt: str, count: int = 3) -> list:
    images = []
    for i in range(count):
        seed = abs(hash(f"{prompt}-{i}")) % 1_000_000
        images.append(generate_image_from_prompt(prompt, seed=seed))
    return images
