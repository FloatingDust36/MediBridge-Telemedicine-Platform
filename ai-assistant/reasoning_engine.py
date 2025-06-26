# reasoning_engine.py

import json

with open("data/condition_rules.json") as f:
    CONDITION_RULES = json.load(f)

def suggest_condition(symptom_info, profile=None):
    user_symptoms = set(symptom_info.get("symptoms", []))
    
    for condition, rule in CONDITION_RULES.items():
        rule_symptoms = set(rule["symptoms"])
        matches = user_symptoms.intersection(rule_symptoms)

        # Minimum 2 matches to consider it a possible condition
        if len(matches) >= 2:
            return rule["explanation"]

    return "I cannot suggest any likely cause based on the current symptoms. More detail may help."