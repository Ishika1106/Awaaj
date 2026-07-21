"""
Processing Latency Benchmark for Awaaj/Haven
Measures: encode time, decode time, regex parsing time, fix_units time,
          end-to-end pipeline timing across multiple runs.
"""

import sys
import os
import time
import statistics

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from PIL import Image
from backend.utils.steganography import encode_text_in_image, decode_text_from_image
from backend.utils.regex_ptr import extract_info
from backend.utils.text_llm import _fix_units

def make_test_image(width: int, height: int) -> Image.Image:
    """Create a simple solid-color test image."""
    return Image.new("RGB", (width, height), (120, 80, 200))


def time_fn(fn, *args, runs: int = 5, **kwargs):
    """Run a function multiple times and return timing stats (ms)."""
    times = []
    result = None
    for _ in range(runs):
        start = time.perf_counter()
        result = fn(*args, **kwargs)
        elapsed = (time.perf_counter() - start) * 1000  # ms
        times.append(elapsed)
    return {
        "min_ms": round(min(times), 3),
        "max_ms": round(max(times), 3),
        "avg_ms": round(statistics.mean(times), 3),
        "median_ms": round(statistics.median(times), 3),
        "std_ms": round(statistics.stdev(times), 3) if len(times) > 1 else 0,
        "runs": runs,
        "result": result,
    }
# Benchmark: Steganography Encode
def bench_encode():
    """Benchmark steganography encoding across image sizes and text lengths."""
    sample_text = "This is a detailed abuse report for benchmarking purposes. " * 30
    configs = [
        ("256x256", 256, 256),
        ("512x512", 512, 512),
        ("768x768", 768, 768),
        ("1024x1024", 1024, 1024),
    ]

    results = []
    for label, w, h in configs:
        img = make_test_image(w, h)
        stats = time_fn(encode_text_in_image, img, sample_text, runs=5)
        results.append({
            "image_size": label,
            "text_length": len(sample_text),
            **{k: v for k, v in stats.items() if k != "result"},
        })
    return results


# Benchmark: Steganography Decode

def bench_decode():
    """Benchmark steganography decoding across image sizes."""
    sample_text = "Decoding benchmark text content for latency measurement. " * 30
    configs = [
        ("256x256", 256, 256),
        ("512x512", 512, 512),
        ("768x768", 768, 768),
        ("1024x1024", 1024, 1024),
    ]

    results = []
    for label, w, h in configs:
        img = make_test_image(w, h)
        encoded = encode_text_in_image(img, sample_text)
        stats = time_fn(decode_text_from_image, encoded, runs=5)
        results.append({
            "image_size": label,
            "text_length": len(sample_text),
            **{k: v for k, v in stats.items() if k != "result"},
        })
    return results

# Benchmark: Regex Extraction


def bench_regex_extraction():
    """Benchmark regex parsing of LLM decomposition output."""
    sample_outputs = [
        "1. Name: Priya Sharma\n2. Location: Mumbai\n3. Preferred way of contact: Phone\n"
        "4. Contact info: +91-9876543210\n5. Frequency of domestic violence: Daily\n"
        "6. Relationship with perpetrator: Spouse\n7. Severity of domestic violence: High\n"
        "8. Nature of domestic violence: Physical\n9. Impact on children: Yes\n"
        "10. Culprit details: Husband\n11. Other info: None",

        "1. Name: Anita\n2. Location: Patna\n3. Preferred way of contact: Email\n"
        "4. Contact info: anita@example.com\n5. Frequency of domestic violence: Weekly\n"
        "6. Relationship with perpetrator: Partner\n7. Severity of domestic violence: Medium\n"
        "8. Nature of domestic violence: Emotional\n9. Impact on children: Not specified\n"
        "10. Culprit details: Not specified\n11. Other info: None",
    ]

    results = []
    for i, output in enumerate(sample_outputs):
        stats = time_fn(extract_info, output, runs=100)
        results.append({
            "sample_id": i,
            "text_length": len(output),
            **{k: v for k, v in stats.items() if k != "result"},
        })

    avg_time = statistics.mean(r["avg_ms"] for r in results)
    return {
        "avg_regex_time_ms": round(avg_time, 4),
        "details": results,
    }
# Benchmark: _fix_units

def bench_fix_units():
    """Benchmark duration unit correction."""
    test_cases = [
        ("Duration of Abuse: 5 months", "She suffered for 5 years"),
        ("Duration of Abuse: 3 weeks", "The abuse lasted 3 months"),
        ("Duration of Abuse: 2 years", "For 2 months she endured"),
        ("Duration of Abuse: 6 days", "This went on for 6 weeks"),
        ("Duration of Abuse: 1 month", "She experienced for 1 year"),
    ]

    results = []
    for orig, llm_text in test_cases:
        stats = time_fn(_fix_units, llm_text, orig, runs=100)
        results.append({
            "input": llm_text,
            **{k: v for k, v in stats.items() if k != "result"},
        })

    avg_time = statistics.mean(r["avg_ms"] for r in results)
    return {
        "avg_fix_units_time_ms": round(avg_time, 4),
        "details": results,
    }

# Benchmark: End-to-End Pipeline 

def bench_end_to_end():
    """Benchmark the full local pipeline: create image -> encode -> decode -> parse."""
    sample_text = (
        "My name is Test Person and I am writing to report ongoing domestic abuse. "
        "I have been experiencing daily physical violence for 5 months at my home in "
        "Mumbai. My husband, who is tall and aggressive, beats me regularly. I prefer "
        "to be contacted by phone. My children are also affected. "
        "Location coordinates are lat: 19.076, lng: 72.8777."
    )

    decomposition_output = (
        "1. Name: Test Person\n2. Location: Mumbai\n3. Preferred way of contact: Phone\n"
        "4. Contact info: Not specified\n5. Frequency of domestic violence: Daily\n"
        "6. Relationship with perpetrator: Spouse\n7. Severity of domestic violence: High\n"
        "8. Nature of domestic violence: Physical\n9. Impact on children: Children affected\n"
        "10. Culprit details: Tall and aggressive\n11. Other info: None"
    )
    def full_pipeline():
        img = make_test_image(768, 768)
        encoded = encode_text_in_image(img, sample_text)
        decoded = decode_text_from_image(encoded)
        parsed = extract_info(decomposition_output)
        fixed = _fix_units(decoded, "Duration of Abuse: 5 months")
        return {
            "encode_success": True,
            "decode_success": decoded == sample_text,
            "parse_success": len(parsed) > 0,
            "fix_units_success": True,
        }

    runs = 10
    times = []
    for _ in range(runs):
        start = time.perf_counter()
        result = full_pipeline()
        elapsed = (time.perf_counter() - start) * 1000
        times.append(elapsed)

    return {
        "runs": runs,
        "min_ms": round(min(times), 3),
        "max_ms": round(max(times), 3),
        "avg_ms": round(statistics.mean(times), 3),
        "median_ms": round(statistics.median(times), 3),
        "std_ms": round(statistics.stdev(times), 3) if len(times) > 1 else 0,
        "pipeline_steps": ["create_image", "encode", "decode", "regex_parse", "fix_units"],
    }

# Main

def run_all_benchmarks():
    """Run all latency benchmarks and return structured results."""
    print("=" * 60)
    print("PROCESSING LATENCY BENCHMARK")
    print("=" * 60)

    print("\n[1/5] Benchmarking Encode...")
    encode_results = bench_encode()
    avg_encode = statistics.mean(r["avg_ms"] for r in encode_results)
    print(f"  Avg encode time: {avg_encode:.2f} ms")

    print("\n[2/5] Benchmarking Decode...")
    decode_results = bench_decode()
    avg_decode = statistics.mean(r["avg_ms"] for r in decode_results)
    print(f"  Avg decode time: {avg_decode:.2f} ms")

    print("\n[3/5] Benchmarking Regex Extraction...")
    regex_results = bench_regex_extraction()
    print(f"  Avg regex time: {regex_results['avg_regex_time_ms']:.4f} ms")

    print("\n[4/5] Benchmarking _fix_units...")
    fix_units_results = bench_fix_units()
    print(f"  Avg fix_units time: {fix_units_results['avg_fix_units_time_ms']:.4f} ms")

    print("\n[5/5] Benchmarking End-to-End Pipeline...")
    e2e = bench_end_to_end()
    print(f"  Avg end-to-end: {e2e['avg_ms']:.2f} ms")

    return {
        "encode_latency": encode_results,
        "decode_latency": decode_results,
        "regex_latency": regex_results,
        "fix_units_latency": fix_units_results,
        "end_to_end_latency": e2e,
    }


if __name__ == "__main__":
    run_all_benchmarks()
