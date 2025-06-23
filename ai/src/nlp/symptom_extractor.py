import spacy
from src.nlp.preprocessor import normalize_text

# Load your trained NER model
nlp = spacy.load("src/nlp/symptom_ner_model")

def extract_entities(text):
    # Step 1: Clean and normalize the input
    clean_text = normalize_text(text)

    # Step 2: Process with NLP model
    doc = nlp(clean_text)

    # Step 3: Organize entities by type
    entities = {"symptoms": [], "duration": None, "severity": None}

    for ent in doc.ents:
        if ent.label_ == "SYMPTOM":
            entities["symptoms"].append(ent.text)
        elif ent.label_ == "DURATION":
            entities["duration"] = ent.text
        elif ent.label_ == "SEVERITY":
            entities["severity"] = ent.text

    return entities
