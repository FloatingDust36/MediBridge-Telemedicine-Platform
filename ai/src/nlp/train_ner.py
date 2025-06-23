import spacy
from spacy.training.example import Example
from training_data import TRAIN_DATA

nlp = spacy.blank("en")  # Start with a blank English model
ner = nlp.add_pipe("ner")

ner.add_label("SYMPTOM")
ner.add_label("DURATION")
ner.add_label("SEVERITY")

# Training loop
nlp.begin_training()
for itn in range(30):  # 30 epochs
    for text, annotations in TRAIN_DATA:
        doc = nlp.make_doc(text)
        example = Example.from_dict(doc, annotations)
        nlp.update([example])

# Save the model
nlp.to_disk("src/nlp/symptom_ner_model")
print("✅ Model trained and saved!")
