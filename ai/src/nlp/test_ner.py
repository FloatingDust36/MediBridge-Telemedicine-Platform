import spacy

nlp = spacy.load("src/nlp/symptom_ner_model")

text = "I feel bloated and have chest pain."
doc = nlp(text)

for ent in doc.ents:
    print(ent.text, "→", ent.label_)
