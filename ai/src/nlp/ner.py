import spacy

# Load spaCy English model
nlp = spacy.load("en_core_web_sm")

def extract_entities(text):
    doc = nlp(text)
    symptoms = []
    duration = None
    severity = None

    for ent in doc.ents:
        if ent.label_ == "DATE" or "time" in ent.label_.lower():
            duration = ent.text

    # Naive keyword matching
    text_lower = text.lower()
    if "mild" in text_lower:
        severity = "mild"
    elif "moderate" in text_lower:
        severity = "moderate"
    elif "severe" in text_lower:
        severity = "severe"

    # Very basic symptom guesses (upgradeable later)
    for token in doc:
        if token.pos_ == "NOUN" and token.text.lower() not in ["pain", "issue"]:
            symptoms.append(token.text)

    return {
        "symptoms": symptoms,
        "duration": duration,
        "severity": severity
    }
