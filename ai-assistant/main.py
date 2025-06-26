# main.py

from gemini_interface import send_user_message
from nlp_symptom_parser import extract_symptom_info
from triage_engine import classify_triage
from reasoning_engine import suggest_condition
from session_logger import create_session_log, log_entry, save_session_log
from pdf_generator import generate_pdf
from image_analysis import classify_image
import json
import os

def load_profile(user_id):
    try:
        path = f"patient_profiles/{user_id}.json"
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"⚠️ No profile found for user '{user_id}'. Using default.")
        return None
    
def main():
    print("🩺 MediBridge AI Health Assistant (Standalone Mode)\n")

    user_id = input("🔐 Enter your user ID or name: ").strip()
    profile = load_profile(user_id)
    if profile:
        print(f"📁 Loaded profile for {profile['name']} ({profile['age']} y/o)")
    
    history = []
    session_log = create_session_log(profile)

    while True:
        user_input = input("👤 You: ")

        if user_input.lower() in ["exit", "quit"]:
            save_session_log(session_log)
            generate_pdf(session_log)
            print("👋 Session ended.")
            break
        elif user_input.startswith("image:"):
            image_path = user_input.replace("image:", "").strip()
            result = classify_image(image_path)

            if "error" in result:
                print(f"❌ Error processing image: {result['error']}")
                continue

            reply = (
            f"🖼️ Based on the image:\n"
            f"- Detected: {result['label']}\n"
            f"- Confidence: {result['confidence']}%\n"
            f"⚠️ {result['disclaimer']}"
            )

            print(f"🤖 MediBridge AI: {reply}")

            # Add to log
            log_entry(
                session_log,
                user_input=image_path,
                ai_reply=reply,
                symptom_info={"symptoms": ["(image analysis)"], "severity": None, "duration": None},  # ✅ fixed key
                triage={
                    "level": 3,
                    "reason": f"Visual symptom detected: {result['label']}",
                    "recommendation": "Consider follow-up if matching user's concern."
                },
                reasoning=f"Classified image suggests: {result['label']} with {result['confidence']}% confidence."
            )
            continue

        # NLP Parsing First
        info = extract_symptom_info(user_input, profile)
        print(f"📊 Parsed: {info}")

        # TRIAGE classification
        triage_result = classify_triage(info, profile)
        print(f"🧠 Triage Result: Level {triage_result['level']} — {triage_result['reason']}")

        # Reasoning engine (possible explanation)
        reason = suggest_condition(info, profile)
        print(f"📚 Possible Cause: {reason}")

        # AI Response
        reply, history = send_user_message(user_input, history)
        print(f"🤖 MediBridge AI: {reply}\n")

        # Log the session entry
        log_entry(session_log, user_input, reply, info, triage_result, reason)

if __name__ == "__main__":
    main()