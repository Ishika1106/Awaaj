#!/usr/bin/env python3
"""
Awaaj - Comprehensive Evaluation Suite Runner
Runs all metrics and generates a structured report for abstracts and papers.

Usage:
    python -m evaluation.run_all          # from project root
    python run_all.py                     # from evaluation/ directory
    python run_all.py --json              # output as JSON only
    python run_all.py --summary           # print abstract-ready summary
"""

import sys
import os
import json
import time
import argparse

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from evaluation.stego_metrics import run_all_stego_metrics
from evaluation.llm_metrics import run_all_llm_metrics
from evaluation.benchmark import run_all_benchmarks


def generate_summary(all_results: dict) -> str:
    """Generate an abstract-ready summary of key metrics."""
    stego = all_results["steganography"]
    llm = all_results["llm_parsing"]
    bench = all_results["latency"]

    # Extract key numbers
    psnr = stego["image_quality"]["avg_psnr_db"]
    ssim = stego["image_quality"]["avg_ssim"]

    regex_f1 = llm["regex_extraction"]["avg_f1"]
    regex_precision = llm["regex_extraction"]["avg_precision"]
    regex_recall = llm["regex_extraction"]["avg_recall"]
    fk_grade = llm["text_readability"]["avg_flesch_kincaid_grade"]
    fre = llm["text_readability"]["avg_flesch_reading_ease"]

    e2e = bench["end_to_end_latency"]["avg_ms"]

    # Capacity for 768x768
    cap_768 = next(
        (c for c in stego["capacity"]["details"] if c["image_size"] == "768x768"), {}
    )
    capacity = cap_768.get("capacity_chars", "N/A")

    lines = [
        "=" * 70,
        "AWAAJ - KEY METRICS",
        "=" * 70,
        "",
        f"  Average PSNR:                 {psnr} dB",
        f"  Average SSIM:                 {ssim}",
        f"  Image Capacity (768x768):     {capacity} characters",
        "",
        f"  Regex Extraction Precision:   {regex_precision}",
        f"  Regex Extraction Recall:      {regex_recall}",
        f"  Regex Extraction F1 Score:    {regex_f1}",
        "",
        f"  Flesch-Kincaid Grade Level:   {fk_grade}",
        f"  Flesch Reading Ease:          {fre}",
        "",
        f"  Avg Encode Time (768x768):    {bench['encode_latency'][2]['avg_ms']} ms",
        f"  Avg Decode Time (768x768):    {bench['decode_latency'][2]['avg_ms']} ms",
        f"  Avg End-to-End Pipeline:      {e2e} ms",
        "",
        "=" * 70,
    ]
    return "\n".join(lines)


import statistics  # noqa: E402  (needed for summary generation)

def main():
    parser = argparse.ArgumentParser(description="Awaaj Evaluation Suite")
    parser.add_argument("--json", action="store_true", help="Output raw JSON only")
    parser.add_argument("--summary", action="store_true", help="Print abstract-ready summary")
    parser.add_argument("--output", type=str, help="Save results to JSON file")
    args = parser.parse_args()

    start_time = time.time()

    # Suppress verbose print output from metric suites
    import io
    _orig_stdout = sys.stdout
    sys.stdout = io.StringIO()

    # Run all metric suites
    all_results = {
        "steganography": run_all_stego_metrics(),
        "llm_parsing": run_all_llm_metrics(),
        "latency": run_all_benchmarks(),
    }

    # Restore stdout
    sys.stdout = _orig_stdout

    elapsed = time.time() - start_time
    all_results["total_runtime_seconds"] = round(elapsed, 2)

    if args.json:
        print(json.dumps(all_results, indent=2))
    elif args.summary:
        print(generate_summary(all_results))
    else:
        print("\n")
        print(generate_summary(all_results))
        print(f"  Total Runtime:                {elapsed:.2f} seconds")
        print("=" * 70)

    if args.output:
        with open(args.output, "w") as f:
            json.dump(all_results, f, indent=2)
        print(f"\nResults saved to {args.output}")

    return all_results


if __name__ == "__main__":
    main()
