import re
from textblob import TextBlob

# Optional: Add your own slang-to-standard dictionary
SLANG_MAP = {
    "havvv": "have",
    "ystrday": "yesterday",
    "tmrw": "tomorrow",
    "hedache": "headache",
    "fevr": "fever",
    "pls": "please",
    "cant": "can't",
    "wanna": "want to",
    "im": "I am",
    "u": "you"
}

def expand_slang(text):
    words = text.split()
    expanded = [SLANG_MAP.get(word.lower(), word) for word in words]
    return " ".join(expanded)

def correct_spelling(text):
    blob = TextBlob(text)
    return str(blob.correct())

def normalize_text(text):
    text = text.lower()
    text = re.sub(r"\s+", " ", text)  # remove extra spaces
    text = re.sub(r"[^a-zA-Z0-9\s']", "", text)  # remove special chars except apostrophes
    text = expand_slang(text)
    text = correct_spelling(text)
    return text.strip()
