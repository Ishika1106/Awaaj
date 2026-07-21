"""
Steganography Evaluation Metrics for Awaaj/Haven
Measures: extraction accuracy, image quality (PSNR), capacity, LSB distribution,
          robustness against JPEG compression and image transformations.
"""

import sys
import os
import time
import math
import io
import random
import statistics

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from PIL import Image, ImageFilter, ImageEnhance
from backend.utils.steganography import encode_text_in_image, decode_text_from_image

def compute_psnr(original: Image.Image, modified: Image.Image) -> float:
    """Compute Peak Signal-to-Noise Ratio between two images."""
    orig_pixels = list(original.convert("RGB").getdata())
    mod_pixels = list(modified.convert("RGB").getdata())

    mse = sum(
        (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2
        for (r1, g1, b1), (r2, g2, b2) in zip(orig_pixels, mod_pixels)
    ) / (len(orig_pixels) * 3)

    if mse == 0:
        return float("inf")
    return 10 * math.log10((255 ** 2) / mse)


def compute_ssim_simple(original: Image.Image, modified: Image.Image) -> float:
    """Simplified SSIM approximation (mean-based luminance + contrast + structure)."""
    orig_gray = list(original.convert("L").getdata())
    mod_gray = list(modified.convert("L").getdata())

    n = len(orig_gray)
    mu_x = statistics.mean(orig_gray)
    mu_y = statistics.mean(mod_gray)
    sigma_x_sq = statistics.variance(orig_gray)
    sigma_y_sq = statistics.variance(mod_gray)
    sigma_xy = sum((x - mu_x) * (y - mu_y) for x, y in zip(orig_gray, mod_gray)) / n

    c1 = (0.02 * 255) ** 2
    c2 = (0.02 * 255) ** 2

    numerator = (2 * mu_x * mu_y + c1) * (2 * sigma_xy + c2)
    denominator = (mu_x ** 2 + mu_y ** 2 + c1) * (sigma_x_sq + sigma_y_sq + c2)
    return numerator / denominator


def lsb_distribution(image: Image.Image) -> dict:
    """Analyze LSB distribution of the red channel."""
    pixels = list(image.convert("RGB").getdata())
    total = len(pixels)
    ones = sum(1 for r, g, b in pixels if r & 1 == 1)
    return {
        "total_pixels": total,
        "lsb_ones": ones,
        "lsb_zeros": total - ones,
        "ones_ratio": ones / total if total else 0,
    }


def make_test_image(width: int, height: int, seed: int = 42) -> Image.Image:
    """Generate a random test image with varied content."""
    random.seed(seed)
    pixels = [
        (random.randint(0, 255), random.randint(0, 255), random.randint(0, 255))
        for _ in range(width * height)
    ]
    img = Image.new("RGB", (width, height))
    img.putdata(pixels)
    return img

def test_extraction_accuracy(image_sizes=None, text_samples=None):
    """
    Encode various texts into various image sizes, decode, compare.
    Returns bit-level and character-level accuracy.
    """
    if image_sizes is None:
        image_sizes = [(64, 64), (128, 128), (256, 256), (512, 512), (768, 768)]
    if text_samples is None:
        text_samples = [
            "Hello World",
            "My name is Priya and I need help. I have been experiencing abuse for 3 months.",
            "A" * 500,
            "Special chars: @#$%^&*()_+-=[]{}|;':\",./<>?`~",
            "\u0939\u093f\u0928\u094d\u0926\u0940 \u092e\u0947\u0902 \u092e\u0926\u0926 \u0939\u0948", 
            "1234567890 " * 50,
        ]

    results = []
    for w, h in image_sizes:
        img = make_test_image(w, h)
        for text in text_samples:
            if len(text) * 8 + 16 > w * h: 
                continue
            is_ascii = all(ord(c) < 256 for c in text)
            encoded = encode_text_in_image(img, text)
            decoded = decode_text_from_image(encoded)

            char_match = decoded == text

            total_bits = len(text) * 8
            matching_bits = sum(
                bin(ord(a) ^ ord(b)).count("0") if len(a) == len(b) else 0
                for a, b in zip(text, decoded)
            )

            results.append({
                "image_size": f"{w}x{h}",
                "text_length": len(text),
                "exact_match": char_match,
                "text_length_decoded": len(decoded),
                "is_ascii": is_ascii,
            })
    return results

# Metric: Image Quality (PSNR + SSIM)

def test_image_quality(image_sizes=None):
    """Measure PSNR and SSIM between original and stego images."""
    if image_sizes is None:
        image_sizes = [(128, 128), (256, 256), (512, 512), (768, 768)]

    results = []
    sample_text = "This is a detailed abuse report for testing PSNR metrics. " * 20

    for w, h in image_sizes:
        img = make_test_image(w, h)
        stego = encode_text_in_image(img, sample_text)

        psnr = compute_psnr(img, stego)
        ssim = compute_ssim_simple(img, stego)

        results.append({
            "image_size": f"{w}x{h}",
            "psnr_db": round(psnr, 2),
            "ssim": round(ssim, 6),
            "text_length": len(sample_text),
        })
    return results
# Metric: Capacity Analysis
def test_capacity():
    """Calculate steganographic capacity for various image sizes."""
    sizes = [
        (256, 256), (512, 512), (768, 768),
        (1024, 1024), (1920, 1080), (3840, 2160),
    ]
    results = []
    for w, h in sizes:
        capacity_bits = w * h
        capacity_bytes = capacity_bits // 8
        capacity_chars = capacity_bytes  
        results.append({
            "image_size": f"{w}x{h}",
            "total_pixels": w * h,
            "capacity_bytes": capacity_bytes,
            "capacity_chars": capacity_chars,
            "utilization_1kb": round(1024 / capacity_bytes * 100, 2),
            "utilization_5kb": round(5120 / capacity_bytes * 100, 2),
            "utilization_typical_report": round(3000 / capacity_bytes * 100, 2),
        })
    return results
# Metric: LSB Statistical Stealth Analysis
def test_lsb_stealth():
    """Compare LSB distribution before and after encoding to measure detectability."""
    sample_text = "Confidential abuse report content. " * 50
    sizes = [(128, 128), (256, 256), (512, 512), (768, 768)]

    results = []
    for w, h in sizes:
        img = make_test_image(w, h)
        stego = encode_text_in_image(img, sample_text)

        before = lsb_distribution(img)
        after = lsb_distribution(stego)

        results.append({
            "image_size": f"{w}x{h}",
            "original_ones_ratio": round(before["ones_ratio"], 4),
            "stego_ones_ratio": round(after["ones_ratio"], 4),
            "ratio_shift": round(abs(after["ones_ratio"] - before["ones_ratio"]), 4),
            "pixels_modified": after["lsb_ones"] - before["lsb_ones"],
        })
    return results

# Metric: Robustness (JPEG compression, noise, resize)

def test_robustness_jpeg():
    """Test if hidden text survives JPEG save/load roundtrip at various qualities."""
    img = make_test_image(512, 512)
    text = "Robustness test report for JPEG compression. " * 30
    stego = encode_text_in_image(img, text)

    qualities = [95, 85, 75, 65, 50, 30, 10]
    results = []
    for q in qualities:
        buf = io.BytesIO()
        stego.save(buf, format="JPEG", quality=q)
        buf.seek(0)
        recovered = Image.open(buf)
        decoded = decode_text_from_image(recovered)
        results.append({
            "jpeg_quality": q,
            "text_recovered": decoded == text,
            "recovered_length": len(decoded),
            "original_length": len(text),
            "recovery_rate": round(len(decoded) / len(text) * 100, 2) if text else 0,
        })
    return results


def test_robustness_transformations():
    """Test hidden text against common image transformations."""
    img = make_test_image(512, 512)
    text = "Transformation robustness test. " * 40
    stego = encode_text_in_image(img, text)

    transforms = {
        "no_transform": lambda im: im,
        "brightness_up": lambda im: ImageEnhance.Brightness(im).enhance(1.2),
        "brightness_down": lambda im: ImageEnhance.Brightness(im).enhance(0.8),
        "contrast_up": lambda im: ImageEnhance.Contrast(im).enhance(1.3),
        "gaussian_blur": lambda im: im.filter(ImageFilter.GaussianBlur(radius=0.5)),
        "rotate_1_deg": lambda im: im.rotate(1, resample=Image.BICUBIC, fillcolor=(0, 0, 0)),
    }

    results = []
    for name, transform in transforms.items():
        transformed = transform(stego)
        decoded = decode_text_from_image(transformed)
        results.append({
            "transformation": name,
            "text_recovered": decoded == text,
            "recovered_length": len(decoded),
            "original_length": len(text),
            "recovery_rate": round(len(decoded) / len(text) * 100, 2) if text else 0,
        })
    return results

def run_all_stego_metrics():
    """Run all steganography metrics and return structured results."""
    print("=" * 60)
    print("STEGANOGRAPHY METRICS")
    print("=" * 60)

    print("\n[1/5] Testing Extraction Accuracy...")
    acc = test_extraction_accuracy()
    total = len(acc)
    exact = sum(1 for r in acc if r["exact_match"])
    ascii_tests = [r for r in acc if r["is_ascii"]]
    unicode_tests = [r for r in acc if not r["is_ascii"]]
    ascii_exact = sum(1 for r in ascii_tests if r["exact_match"])
    unicode_exact = sum(1 for r in unicode_tests if r["exact_match"])
    print(f"  Total tests: {total}, Exact matches: {exact} ({exact/total*100:.1f}%)")
    print(f"  ASCII accuracy: {ascii_exact}/{len(ascii_tests)} ({ascii_exact/len(ascii_tests)*100:.1f}%)" if ascii_tests else "")
    print(f"  Unicode accuracy: {unicode_exact}/{len(unicode_tests)} ({unicode_exact/len(unicode_tests)*100:.1f}%)" if unicode_tests else "")

    print("\n[2/5] Testing Image Quality (PSNR/SSIM)...")
    quality = test_image_quality()
    avg_psnr = statistics.mean(r["psnr_db"] for r in quality if r["psnr_db"] != float("inf"))
    avg_ssim = statistics.mean(r["ssim"] for r in quality)
    print(f"  Avg PSNR: {avg_psnr:.2f} dB, Avg SSIM: {avg_ssim:.6f}")

    print("\n[3/5] Analyzing Capacity...")
    cap = test_capacity()
    cap_768 = next((c for c in cap if c["image_size"] == "768x768"), None)
    if cap_768:
        print(f"  768x768 capacity: {cap_768['capacity_chars']} chars ({cap_768['capacity_bytes']} bytes)")

    print("\n[4/5] Testing LSB Stealth...")
    stealth = test_lsb_stealth()
    print(f"  Average ratio shift: {statistics.mean(r['ratio_shift'] for r in stealth):.4f}")

    print("\n[5/5] Testing Robustness...")
    jpeg_rob = test_robustness_jpeg()
    trans_rob = test_robustness_transformations()
    jpeg_ok = sum(1 for r in jpeg_rob if r["text_recovered"])
    print(f"  JPEG: {jpeg_ok}/{len(jpeg_rob)} quality levels preserved text")
    trans_ok = sum(1 for r in trans_rob if r["text_recovered"])
    print(f"  Transformations: {trans_ok}/{len(trans_rob)} preserved text")

    return {
        "extraction_accuracy": {
            "total_tests": total,
            "exact_matches": exact,
            "accuracy_rate": round(exact / total * 100, 1),
            "details": acc,
        },
        "image_quality": {
            "avg_psnr_db": round(avg_psnr, 2),
            "avg_ssim": round(avg_ssim, 6),
            "details": quality,
        },
        "capacity": {"details": cap},
        "lsb_stealth": {
            "avg_ratio_shift": round(statistics.mean(r["ratio_shift"] for r in stealth), 4),
            "details": stealth,
        },
        "robustness": {
            "jpeg": {"passing": jpeg_ok, "total": len(jpeg_rob), "details": jpeg_rob},
            "transformations": {"passing": trans_ok, "total": len(trans_rob), "details": trans_rob},
        },
    }


if __name__ == "__main__":
    run_all_stego_metrics()
