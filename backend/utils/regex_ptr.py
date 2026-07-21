import re


def extract_info(text):
    pattern = r"(\d+)\.\s*(.*?):\s*(.*)"
    matches = re.findall(pattern, text)
    data_dict = {key.strip(): value.strip() for _, key, value in matches}

    return data_dict
