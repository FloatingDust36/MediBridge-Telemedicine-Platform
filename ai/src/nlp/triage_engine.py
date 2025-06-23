import spacy
import joblib
from src.utils.session_logger import log_session
import json
import os

# Load NER model
ner = spacy.load("src/nlp/symptom_ner_model")

# Load classifier
clf = joblib.load("src/nlp/triage_classifier.pkl")

# Triage level to label
level_labels = {
    1: "Resuscitation",
    2: "Emergency",
    3: "Urgent",
    4: "Less Urgent",
    5: "Non-Urgent"
}

LOG_FILE = "src/logs/triage_logs.json"

def load_user_history(user_id):
    if not os.path.exists(LOG_FILE):
        return []

    with open(LOG_FILE, "r") as f:
        logs = json.load(f)

    return [log for log in logs if log.get("user_id") == user_id]

def extract_entities(text):
    doc = ner(text)
    symptoms = []
    severity = None
    duration = None

    for ent in doc.ents:
        if ent.label_ == "SYMPTOM":
            symptoms.append(ent.text)
        elif ent.label_ == "SEVERITY":
            severity = ent.text
        elif ent.label_ == "DURATION":
            duration = ent.text

    return {
        "symptoms": symptoms,
        "severity": severity,
        "duration": duration
    }

def predict_urgency(symptoms, severity, duration):
    combined = f"{', '.join(symptoms)} {duration} {severity}"
    pred = clf.predict([combined])[0]
    proba = clf.predict_proba([combined])[0]
    return {
        "triage_level": int(pred),
        "triage_label": level_labels[int(pred)],
        "confidence": float(round(max(proba), 2))
    }

def run_triage():
    print("🤖 Hello! I’m MediBridge AI Triage Assistant.")
    print("🤖 I’ll ask you a few questions to understand your condition.\n")

    print("⚖️  Disclaimer: I am an AI assistant, not a licensed medical professional.")
    print("⚠️  I do not diagnose conditions. I help evaluate urgency based on your symptoms.")
    print("📋 All responses are logged and can be reviewed by a real doctor if needed.\n")
    
    # Ask for user ID
    user_id = input("👤 Please enter your name or user ID:\n🧑 ").strip().lower()

    # Load past sessions
    history = load_user_history(user_id)

    if history:
        print(f"📜 Welcome back, {user_id}. I found {len(history)} previous session(s).")
        last = history[-1]
        print("🕓 Last symptoms reported:", ", ".join(last["symptoms"]))
        print("📶 Last severity:", last["severity"])
        print("⏳ Last duration:", last["duration"])
        print("🚨 Last urgency level:", last["triage_label"])
        print()
    else:
        print(f"👋 Nice to meet you, {user_id}!\n")

    # Ask for symptoms
    while True:
        user_input = input("🤖 What symptoms are you experiencing?\n🧑 ").strip()
        if user_input:
            break
        print("⚠️ Please describe at least one symptom.")

    ent_result = extract_entities(user_input)

    # If no symptoms were extracted
    if not ent_result["symptoms"]:
        print("🤖 Sorry, I couldn't recognize any symptoms from that.")
        user_input_retry = input("🔁 Could you rephrase or list your symptoms again?\n🧑 ").strip()
        ent_result = extract_entities(user_input_retry)

    if not ent_result["symptoms"]:
        print("⚠️ I’m still having trouble understanding your symptoms.")
        print("📞 It’s best to consult a human doctor directly for now.")
        return  # Exit safely

    # Ask for severity if not found or empty
    while not ent_result["severity"] or ent_result["severity"].strip() == "":
        severity_input = input("🤖 How severe is it? (mild, moderate, severe)\n🧑 ").strip().lower()
        if severity_input in ["mild", "moderate", "severe"]:
            ent_result["severity"] = severity_input
        else:
            print("⚠️ Please enter a valid severity: mild, moderate, or severe.")

    # Ask for duration if not found or empty
    while not ent_result["duration"] or ent_result["duration"].strip() == "":
        duration_input = input("🤖 How long have you had this?\n🧑 ").strip()
        if duration_input:
            ent_result["duration"] = duration_input
        else:
            print("⚠️ Please enter a valid duration (e.g., '2 days', 'since last night').")

    # Classify urgency
    urgency_result = predict_urgency(
        symptoms=ent_result["symptoms"],
        severity=ent_result["severity"],
        duration=ent_result["duration"]
    )

    if urgency_result["confidence"] < 0.4:
        print("\n🤖 I’m not confident in my evaluation.")
        print("📞 Please consider speaking with a human doctor as soon as possible.")
        urgency_result["triage_label"] = "Uncertain (Escalate)"
        urgency_result["triage_level"] = "?"
        suggested_action = "Seek immediate human consultation."

    # Final summary
    print("\n📋 TRIAGE SUMMARY")
    print("--------------------------")
    print("🩺 Symptoms:", ", ".join(ent_result["symptoms"]))
    print("⏳ Duration:", ent_result["duration"])
    print("📶 Severity:", ent_result["severity"])
    print("🚨 Urgency Level:", urgency_result["triage_level"], f"({urgency_result['triage_label']})")
    print("🎯 Confidence:", urgency_result["confidence"])
    print("📎 Suggested Action:", end=" ")

    # Determine suggestion based on urgency level
    if urgency_result["triage_level"] <= 2:
        suggested_action = "Go to the nearest hospital immediately!"
    elif urgency_result["triage_level"] <= 4:
        suggested_action = "Book an online consultation."
    elif urgency_result["triage_level"] != "?":
        suggested_action = "No emergency. You may self-monitor or consult if needed."

    print(suggested_action)

    print("\n⚠️  Please remember: This AI does not replace real doctors.")
    print("📞 If you're unsure or feel worse, seek medical attention immediately.\n")

    # Logging (fixed variable names)
    log_data = {
        "user_id": user_id,
        "symptoms": ent_result["symptoms"],
        "severity": ent_result["severity"],
        "duration": ent_result["duration"],
        "triage_level": urgency_result["triage_level"],
        "triage_label": urgency_result["triage_label"],
        "confidence": urgency_result["confidence"],
        "suggested_action": suggested_action,
         "ai_disclaimer_acknowledged": True
    }

    log_session(log_data)

    return {
        **ent_result,
        **urgency_result,
        "suggested_action": suggested_action
    }

# Run it in terminal
if __name__ == "__main__":
    try:
        run_triage()
    except Exception as e:
        print("❌ Something went wrong. Please try again later.")
        print("🔧 Error details (for devs):", e)
