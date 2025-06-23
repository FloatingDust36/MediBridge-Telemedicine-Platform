from src.nlp.symptom_extractor import extract_entities

text = "i havvv a sharp hedache since ystrday"
result = extract_entities(text)

print("INPUT:", text)
print("OUTPUT:", result)
