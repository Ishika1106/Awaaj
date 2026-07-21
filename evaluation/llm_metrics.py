"""
LLM Parsing & Readability Evaluation Metrics for Awaaj/Haven
Measures: regex extraction accuracy, field coverage, text readability scores,
          expansion ratio, duration unit preservation, decomposed output format compliance.
"""

import sys
import os
import re
import statistics

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from backend.utils.regex_ptr import extract_info
from backend.utils.text_llm import _fix_units

SAMPLE_DECOMPOSITION_OUTPUTS = [
    (
        "1. Name: Priya Sharma\n2. Location: Mumbai, Maharashtra\n3. Preferred way of contact: Phone\n"
        "4. Contact info: +91-9876543210\n5. Frequency of domestic violence: Daily\n"
        "6. Relationship with perpetrator: Spouse\n7. Severity of domestic violence: High\n"
        "8. Nature of domestic violence: Physical\n9. Impact on children: Children witness violence\n"
        "10. Culprit details: Husband, age 35, aggressive behavior\n11. Other info: None",
        {
            "Name": "Priya Sharma",
            "Location": "Mumbai, Maharashtra",
            "Preferred way of contact": "Phone",
            "Contact info": "+91-9876543210",
            "Frequency of domestic violence": "Daily",
            "Relationship with perpetrator": "Spouse",
            "Severity of domestic violence": "High",
            "Nature of domestic violence": "Physical",
            "Impact on children": "Children witness violence",
            "Culprit details": "Husband, age 35, aggressive behavior",
            "Other info": "None",
        },
    ),
    (
        "1. Name: Anita Kumari\n2. Location: Patna, Bihar\n3. Preferred way of contact: Email\n"
        "4. Contact info: anita.k@example.com\n5. Frequency of domestic violence: Weekly\n"
        "6. Relationship with perpetrator: Partner\n7. Severity of domestic violence: Medium\n"
        "8. Nature of domestic violence: Emotional\n9. Impact on children: Not specified\n"
        "10. Culprit details: Not specified\n11. Other info: Victim has sought help from neighbor",
        {
            "Name": "Anita Kumari",
            "Location": "Patna, Bihar",
            "Preferred way of contact": "Email",
            "Contact info": "anita.k@example.com",
            "Frequency of domestic violence": "Weekly",
            "Relationship with perpetrator": "Partner",
            "Severity of domestic violence": "Medium",
            "Nature of domestic violence": "Emotional",
            "Impact on children": "Not specified",
            "Culprit details": "Not specified",
            "Other info": "Victim has sought help from neighbor",
        },
    ),
    (
        "1. Name: Not specified\n2. Location: Delhi\n3. Preferred way of contact: Not specified\n"
        "4. Contact info: Not specified\n5. Frequency of domestic violence: Occasionally\n"
        "6. Relationship with perpetrator: Family Member\n7. Severity of domestic violence: Low\n"
        "8. Nature of domestic violence: Psychological\n9. Impact on children: Not specified\n"
        "10. Culprit details: Father figure, drinks heavily\n11. Other info: Victim is a minor",
        {
            "Name": "Not specified",
            "Location": "Delhi",
            "Preferred way of contact": "Not specified",
            "Contact info": "Not specified",
            "Frequency of domestic violence": "Occasionally",
            "Relationship with perpetrator": "Family Member",
            "Severity of domestic violence": "Low",
            "Nature of domestic violence": "Psychological",
            "Impact on children": "Not specified",
            "Culprit details": "Father figure, drinks heavily",
            "Other info": "Victim is a minor",
        },
    ),
    (
        "1. Name: Sunita Devi\n2. Location: Jaipur, Rajasthan\n3. Preferred way of contact: Phone\n"
        "4. Contact info: +91-9123456789\n5. Frequency of domestic violence: Daily\n"
        "6. Relationship with perpetrator: Spouse\n7. Severity of domestic violence: Very High\n"
        "8. Nature of domestic violence: Combination\n9. Impact on children: Two children aged 5 and 8 are deeply affected\n"
        "10. Culprit details: Husband, tall, beard, uses alcohol\n11. Other info: Police complaint filed previously",
        {
            "Name": "Sunita Devi",
            "Location": "Jaipur, Rajasthan",
            "Preferred way of contact": "Phone",
            "Contact info": "+91-9123456789",
            "Frequency of domestic violence": "Daily",
            "Relationship with perpetrator": "Spouse",
            "Severity of domestic violence": "Very High",
            "Nature of domestic violence": "Combination",
            "Impact on children": "Two children aged 5 and 8 are deeply affected",
            "Culprit details": "Husband, tall, beard, uses alcohol",
            "Other info": "Police complaint filed previously",
        },
    ),
    (
        "1. Name: Meera\n2. Location: Bangalore, Karnataka\n3. Preferred way of contact: Not specified\n"
        "4. Contact info: Not specified\n5. Frequency of domestic violence: Not specified\n"
        "6. Relationship with perpetrator: Not specified\n7. Severity of domestic violence: Not specified\n"
        "8. Nature of domestic violence: Not specified\n9. Impact on children: Not specified\n"
        "10. Culprit details: Not specified\n11. Other info: Minimal information provided",
        {
            "Name": "Meera",
            "Location": "Bangalore, Karnataka",
            "Preferred way of contact": "Not specified",
            "Contact info": "Not specified",
            "Frequency of domestic violence": "Not specified",
            "Relationship with perpetrator": "Not specified",
            "Severity of domestic violence": "Not specified",
            "Nature of domestic violence": "Not specified",
            "Impact on children": "Not specified",
            "Culprit details": "Not specified",
            "Other info": "Minimal information provided",
        },
    ),
    (
        "1. Name: Rekha Patel\n2. Location: Lucknow, Uttar Pradesh\n3. Preferred way of contact: Phone\n"
        "4. Contact info: +91-8765432100\n5. Frequency of domestic violence: Often\n"
        "6. Relationship with perpetrator: Husband\n7. Severity of domestic violence: High\n"
        "8. Nature of domestic violence: Physical\n9. Impact on children: Children are deeply affected\n"
        "10. Culprit details: Husband, age 40, drinks heavily\n11. Other info: Victim has called helpline before",
        {
            "Name": "Rekha Patel",
            "Location": "Lucknow, Uttar Pradesh",
            "Preferred way of contact": "Phone",
            "Contact info": "+91-8765432100",
            "Frequency of domestic violence": "Daily",
            "Relationship with perpetrator": "Spouse",
            "Severity of domestic violence": "High",
            "Nature of domestic violence": "Physical",
            "Impact on children": "Children witness violence",
            "Culprit details": "Husband, age 40, drinks heavily",
            "Other info": "Victim has called helpline before",
        },
    ),
    (
        "1. Name: Meena Kumari\n2. Location: Chandigarh\n3. Preferred way of contact Not specified\n"
        "4. Contact info: Not specified\n5. Frequency of domestic violence: Weekly\n"
        "6. Relationship with perpetrator: Partner\n7. Severity of domestic violence: Medium\n"
        "8. Nature of domestic violence: Verbal\n9. Impact on children: One child\n"
        "10. Culprit details: Not specified\n11. Other info: Victim works night shifts",
        {
            "Name": "Meena Kumari",
            "Location": "Chandigarh",
            "Preferred way of contact": "Not specified",
            "Contact info": "Not specified",
            "Frequency of domestic violence": "Weekly",
            "Relationship with perpetrator": "Partner",
            "Severity of domestic violence": "Medium",
            "Nature of domestic violence": "Verbal",
            "Impact on children": "One child",
            "Culprit details": "Not specified",
            "Other info": "Victim works night shifts",
        },
    ),
]

MALFORMED_OUTPUTS = [
    "Name: Priya\nLocation: Mumbai", 
    "1. Name: Test\n3. Location: Delhi",
    "1) Name: X\n2) Location: Y",  
    "",  
    "This is random text with no structured data",  
]



def count_syllables(word: str) -> int:
    """Estimate syllable count for English words."""
    word = word.lower().strip(".,!?;:'\"")
    if not word:
        return 0
    if len(word) <= 3:
        return 1
    vowels = "aeiouy"
    count = 0
    prev_vowel = False
    for ch in word:
        is_vowel = ch in vowels
        if is_vowel and not prev_vowel:
            count += 1
        prev_vowel = is_vowel
    if word.endswith("e"):
        count -= 1
    return max(1, count)


def flesch_kincaid_grade(text: str) -> float:
    """Compute Flesch-Kincaid Grade Level."""
    sentences = max(1, len(re.split(r"[.!?]+", text.strip())))
    words = text.split()
    word_count = max(1, len(words))
    syllable_count = sum(count_syllables(w) for w in words)
    return 0.39 * (word_count / sentences) + 11.8 * (syllable_count / word_count) - 15.59


def flesch_reading_ease(text: str) -> float:
    """Compute Flesch Reading Ease score."""
    sentences = max(1, len(re.split(r"[.!?]+", text.strip())))
    words = text.split()
    word_count = max(1, len(words))
    syllable_count = sum(count_syllables(w) for w in words)
    return 206.835 - 1.015 * (word_count / sentences) - 84.6 * (syllable_count / word_count)


def text_statistics(text: str) -> dict:
    """Compute basic text statistics."""
    words = text.split()
    sentences = [s.strip() for s in re.split(r"[.!?]+", text.strip()) if s.strip()]
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    return {
        "char_count": len(text),
        "word_count": len(words),
        "sentence_count": len(sentences),
        "paragraph_count": max(1, len(paragraphs)),
        "avg_words_per_sentence": round(len(words) / max(1, len(sentences)), 1),
        "flesch_kincaid_grade": round(flesch_kincaid_grade(text), 2),
        "flesch_reading_ease": round(flesch_reading_ease(text), 2),
    }

# Metric 1: Regex Field Extraction Accuracy

def test_regex_extraction_accuracy():
    """Test extract_info() against known decomposition outputs."""
    results = []
    for raw_output, expected in SAMPLE_DECOMPOSITION_OUTPUTS:
        extracted = extract_info(raw_output)

        all_expected_keys = list(expected.keys())
        matched_keys = [k for k in all_expected_keys if k in extracted and extracted[k] == expected[k]]
        matched_values = [k for k in all_expected_keys if k in extracted]

        field_precision = (
            len(matched_keys) / len(extracted) if extracted else 0
        )
        field_recall = (
            len(matched_keys) / len(all_expected_keys) if all_expected_keys else 0
        )
        field_f1 = (
            2 * field_precision * field_recall / (field_precision + field_recall)
            if (field_precision + field_recall) > 0
            else 0
        )

        results.append({
            "expected_fields": len(all_expected_keys),
            "extracted_fields": len(extracted),
            "correct_fields": len(matched_keys),
            "precision": round(field_precision, 4),
            "recall": round(field_recall, 4),
            "f1": round(field_f1, 4),
            "all_fields_correct": len(matched_keys) == len(all_expected_keys),
        })

    avg_precision = statistics.mean(r["precision"] for r in results)
    avg_recall = statistics.mean(r["recall"] for r in results)
    avg_f1 = statistics.mean(r["f1"] for r in results)
    return {
        "total_samples": len(results),
        "perfect_extractions": sum(1 for r in results if r["all_fields_correct"]),
        "avg_precision": round(avg_precision, 4),
        "avg_recall": round(avg_recall, 4),
        "avg_f1": round(avg_f1, 4),
        "details": results,
    }


def test_regex_malformed_input():
    """Test extract_info() against malformed/non-standard inputs."""
    results = []
    for text in MALFORMED_OUTPUTS:
        extracted = extract_info(text)
        results.append({
            "input_preview": text[:80] if text else "(empty)",
            "fields_extracted": len(extracted),
            "handles_gracefully": True,  # no crash = graceful
        })
    return {
        "total_tests": len(results),
        "all_passed": all(r["handles_gracefully"] for r in results),
        "details": results,
    }

# Metric 2: Duration Unit Preservation 

def test_fix_units():
    """
    Test _fix_units() correctly patches unit mismatches.
    NOTE: The original function has a known bug where {0,2} in the rf-string
    is interpreted as Python syntax instead of a regex quantifier, so replacements
    never actually happen. This test documents both the intended behavior and the
    actual behavior.
    """
    test_cases = [
        ("Duration of Abuse: 5 months", "She suffered for 5 years and 3 months", "5 months"),
        ("Duration of Abuse: 3 weeks", "The abuse lasted 3 months", "3 weeks"),
        ("Duration of Abuse: 2 years", "For 2 months she endured this", "2 years"),
        ("Duration of Abuse: 6 days", "This went on for 6 weeks", "6 days"),
        ("Duration of Abuse: 1 month", "She experienced this for 1 year", "1 month"),
        ("Duration of Abuse: 10 days", "10 months of suffering", "10 days"),
        ("Duration of Abuse: 5 months", "5 months of abuse", "5 months"),  
        ("Duration of Abuse: 3 years", "3 years of abuse", "3 years"),  
    ]

    results = []
    for original_data, llm_text, expected_duration in test_cases:
        fixed = _fix_units(llm_text, original_data)
        contains_expected = expected_duration in fixed
        was_modified = fixed != llm_text

        results.append({
            "original_data": original_data,
            "llm_text": llm_text,
            "expected_in_output": expected_duration,
            "found": contains_expected,
            "function_modified_text": was_modified,
        })

    correctly_handled = sum(1 for r in results if r["found"])
    actually_modified = sum(1 for r in results if r["function_modified_text"])
    return {
        "total_tests": len(results),
        "passed": correctly_handled,
        "pass_rate": round(correctly_handled / len(results) * 100, 1),
        "known_bug": "rf-string {0,2} is interpreted as Python tuple (0, 2) instead of regex quantifier",
        "function_actually_modified_any_input": actually_modified > 0,
        "details": results,
    }
# Metric 3: Text Readability Analysis


def test_text_readability():
    """Analyze readability of sample LLM-expanded reports."""
    sample_reports = [
        "My name is Priya Sharma and I live in Mumbai. My husband has been physically "
        "abusing me for 5 months. He hits me daily and I am terrified. The frequency of "
        "violence has increased over the past weeks. I need immediate help and prefer "
        "to be contacted by phone at +91-9876543210. My children witness the abuse and "
        "are deeply traumatized. My husband is tall, aggressive, and drinks heavily. "
        "Location coordinates are lat: 19.076, lng: 72.8777. I fear for my life.",

        "I, Anita Kumari, residing in Patna, Bihar, am writing to report ongoing emotional "
        "abuse by my partner. The incidents occur weekly and have been happening for the "
        "past 3 months. My partner verbally threatens and manipulates me. I have two "
        "children, aged 6 and 10, who are affected by this hostile environment. I would "
        "prefer contact via email at anita.k@example.com. Coordinates: lat: 25.6, lng: 85.1.",

        "Help me. I am being abused. My husband beats me. This has been going on for a "
        "long time. I do not know what to do anymore. Please someone help me. I am scared "
        "and alone. The children are crying. He comes home drunk every night and hurts us.",
    ]

    results = []
    for report in sample_reports:
        stats = text_statistics(report)
        results.append(stats)

    return {
        "total_reports": len(results),
        "avg_word_count": round(statistics.mean(r["word_count"] for r in results), 1),
        "avg_sentence_count": round(statistics.mean(r["sentence_count"] for r in results), 1),
        "avg_flesch_kincaid_grade": round(
            statistics.mean(r["flesch_kincaid_grade"] for r in results), 2
        ),
        "avg_flesch_reading_ease": round(
            statistics.mean(r["flesch_reading_ease"] for r in results), 2
        ),
        "details": results,
    }
# Metric 4: Expansion Ratio (simulated)

def test_expansion_ratio():
    """Compute expansion ratio for typical user inputs vs expanded reports."""
    form_inputs = [
        "Priya Sharma, phone: +91-9876543210, email: priya@example.com, "
        "location: 19.076,72.8777, duration: 5 months, frequency: daily, "
        "contact: phone, situation: husband beats me regularly, "
        "culprit: tall aggressive man, custom: please help",

        "Anita Kumari, phone: none, email: anita.k@example.com, "
        "location: 25.6,85.1, duration: 3 months, frequency: weekly, "
        "contact: email, situation: verbal abuse and emotional manipulation, "
        " culprit: partner who drinks, custom: none",

        "S, phone: 9123456789, email: none, "
        "location: 26.9,75.8, duration: 2 years, frequency: daily, "
        "contact: phone, situation: severe physical abuse, culprit: husband, "
        "custom: children are also affected",
    ]

    expanded_lengths = [850, 720, 650] 

    results = []
    for i, (inp, exp_len) in enumerate(zip(form_inputs, expanded_lengths)):
        ratio = exp_len / len(inp) if inp else 0
        results.append({
            "input_length": len(inp),
            "expanded_length": exp_len,
            "expansion_ratio": round(ratio, 2),
        })

    return {
        "avg_expansion_ratio": round(
            statistics.mean(r["expansion_ratio"] for r in results), 2
        ),
        "details": results,
    }
# Metric 5: Decomposition Format Compliance

def test_format_compliance():
    """Verify that the regex pattern handles the expected output format."""
    pattern = r"(\d+)\.\s*(.*?):\s*(.*)"

    test_outputs = [
        "1. Name: Test Person",
        "11. Other info: Some additional info here",
        "5. Frequency of domestic violence: Daily",
        "1. Name: Colons: in value: here",
        "2. Location: City, State, Country",
    ]

    results = []
    for text in test_outputs:
        matches = re.findall(pattern, text)
        results.append({
            "input": text,
            "matched": len(matches) > 0,
            "fields_extracted": len(matches),
        })

    return {
        "total_tests": len(results),
        "all_matched": all(r["matched"] for r in results),
        "details": results,
    }

def run_all_llm_metrics():
    """Run all LLM/readability metrics and return structured results."""
    print("=" * 60)
    print("LLM PARSING & READABILITY METRICS")
    print("=" * 60)

    print("\n[1/5] Testing Regex Extraction Accuracy...")
    regex_acc = test_regex_extraction_accuracy()
    print(f"  Samples: {regex_acc['total_samples']}, Perfect: {regex_acc['perfect_extractions']}")
    print(f"  Avg Precision: {regex_acc['avg_precision']}, Recall: {regex_acc['avg_recall']}, F1: {regex_acc['avg_f1']}")

    print("\n[2/5] Testing Malformed Input Handling...")
    malformed = test_regex_malformed_input()
    print(f"  All handled gracefully: {malformed['all_passed']}")

    print("\n[3/5] Testing Duration Unit Preservation...")
    fix_units = test_fix_units()
    print(f"  Pass rate: {fix_units['pass_rate']}% ({fix_units['passed']}/{fix_units['total_tests']})")

    print("\n[4/5] Analyzing Text Readability...")
    readability = test_text_readability()
    print(f"  Avg FK Grade: {readability['avg_flesch_kincaid_grade']}, "
          f"Avg Reading Ease: {readability['avg_flesch_reading_ease']}")

    print("\n[5/5] Computing Expansion Ratio...")
    expansion = test_expansion_ratio()
    print(f"  Avg Expansion Ratio: {expansion['avg_expansion_ratio']}x")

    return {
        "regex_extraction": regex_acc,
        "malformed_input_handling": malformed,
        "duration_unit_preservation": fix_units,
        "text_readability": readability,
        "expansion_ratio": expansion,
        "format_compliance": test_format_compliance(),
    }


if __name__ == "__main__":
    run_all_llm_metrics()
