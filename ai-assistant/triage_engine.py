# triage_engine.py

import json
import re

with open("data/triage_rules.json") as f:
    TRIAGE_RULES = json.load(f)

def classify_triage(symptom_info, profile=None):
    symptoms = symptom_info.get("symptoms", [])
    severity = symptom_info.get("severity")
    duration = symptom_info.get("duration")

    # Default triage level
    level = 5
    reason = "Symptoms unclear or not recognized"

    # Simple keyword-based triage (base logic)
    if "chest pain" in symptoms or "shortness of breath" in symptoms:
        level = 2
        reason = "Possible cardiac or respiratory issue"

    elif "fever" in symptoms and severity == "high":
        level = 3
        reason = "High fever can indicate infection"

    elif "headache" in symptoms and duration == "long":
        level = 4
        reason = "Chronic headache may require consult"

    elif symptoms:
        level = 5
        reason = "General symptoms detected"

    # --- Apply Profile-Based Risk Escalation ---
    if profile:
        chronic = profile.get("chronic_conditions", [])
        risks = profile.get("risk_factors", [])
        age = profile.get("age", 30)

        red_flags = ["chest pain", "shortness of breath", "dizziness"]
        cardiac_conditions = ["hypertension", "heart disease", "diabetes"]

        if any(symptom in red_flags for symptom in symptoms):
            if any(cond in chronic for cond in cardiac_conditions):
                level = min(level, 1)
                reason += " (escalated due to chronic cardiac risk)"

        if "asthma" in chronic and "shortness of breath" in symptoms:
            level = min(level, 2)
            reason += " (escalated due to asthma)"

        if age >= 65 and "fever" in symptoms:
            level = min(level, 2)
            reason += " (elderly + fever = higher risk)"

        if "immunocompromised" in risks and "infection" in reason.lower():
            level = min(level, 2)
            reason += " (user is immunocompromised)"

    # Final decision
    return {
        "level": level,
        "reason": reason,
        "recommendation": {
            1: "Go to emergency room immediately.",
            2: "Seek urgent care or ER if symptoms worsen.",
            3: "Book a doctor within 24–48 hours.",
            4: "See a doctor if it persists.",
            5: "General advice and follow-up questions needed."
        }.get(level, "Unable to recommend next steps.")
    }