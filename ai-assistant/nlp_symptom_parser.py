# nlp_symptom_parser.py

import spacy
import re

nlp = spacy.load("en_core_web_sm")

# Sample severity and duration patterns
SEVERITY_KEYWORDS = ["mild", "moderate", "severe", "intense", "unbearable", "light"]
DURATION_PATTERNS = [
    r"for (\d+ days?)", r"for (\d+ weeks?)", r"since (yesterday|last night|this morning)",
    r"(today|yesterday|last week|this week)", r"(\d+ hours? ago)", r"(\d+ days? ago)"
]

def extract_symptom_info(text, profile=None):
    doc = nlp(text.lower())
    symptoms = []
    severity = None
    duration = None

    # Try to extract symptoms from noun chunks (simple heuristic)
    for chunk in doc.noun_chunks:
        if any(word in chunk.text for word in ["pain", "ache", "fever", "throat", "headache", "rash", "cough", "chills", "nausea", "dizzy", "fatigue", "vomiting", "sore"]):
            symptoms.append(chunk.text.strip())

    # Use regex to find duration
    for pattern in DURATION_PATTERNS:
        match = re.search(pattern, text.lower())
        if match:
            duration = match.group(0)
            break

    # Find severity word
    for word in doc:
        if word.text in SEVERITY_KEYWORDS:
            severity = word.text
            break

    return {
        "symptoms": list(set(symptoms)),  # Remove duplicates
        "severity": severity,
        "duration": duration
    }

# For testing directly
if __name__ == "__main__":
    test = "I have a severe sore throat and mild headache for 3 days now."
    result = extract_symptom_info(test)
    print(result)