# src/logic/reasoning_engine.py

def interpret_symptoms(symptoms: list) -> str:
    """
    Analyzes combinations of symptoms and returns a possible interpretation.
    This is a basic rule-based reasoning layer. Later upgradeable to ML.
    """

    symptoms = [s.lower() for s in symptoms]
    interpretation = "No specific condition detected."

    # Basic pattern matching
    if all(s in symptoms for s in ["fever", "cough", "fatigue"]):
        interpretation = "🦠 These symptoms may indicate influenza or another viral infection."
    elif all(s in symptoms for s in ["headache", "neck stiffness", "fever"]):
        interpretation = "⚠️ These symptoms could suggest meningitis. Seek immediate medical attention."
    elif all(s in symptoms for s in ["chest pain", "shortness of breath"]):
        interpretation = "🚨 These could be signs of a cardiac emergency. Immediate care is recommended."
    elif all(s in symptoms for s in ["abdominal pain", "vomiting", "fever"]):
        interpretation = "🤒 Possible appendicitis or GI infection. Consult a doctor."

    return interpretation
