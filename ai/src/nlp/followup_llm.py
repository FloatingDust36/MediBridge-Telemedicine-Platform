from multiprocessing import context
import google.generativeai as genai
import os
from src.safety.guardrails import is_unsafe_input, patch_input
from datetime import datetime

GOOGLE_API_KEY = "AIzaSyAvXEJOKy3ge5lGvoeneBTkcXsz83XWLsw"  # Replace with your real key
genai.configure(api_key=GOOGLE_API_KEY)

NURSE_SYSTEM_INSTRUCTION = """
You are MediBridge — a professional, cautious, and empathetic AI Nurse Assistant speaking directly to the patient.

Your job is to provide **general health advice** in a way that is:
- Medically safe
- Realistic and responsible
- Short, calm, and human-like
- Not overly technical or robotic

🎯 Your tone is:
- Friendly, realistic, calm, and human-like
- First-person ("I recommend", "I understand", "I suggest…")
- Supportive like a real nurse, not robotic

🩺 DO:
- Use medically sound reasoning
- Personalize based on patient’s context (age, sex, symptoms, severity)
- Speak like a nurse with warmth and professionalism
- Keep answers short and direct

🚫 DO NOT:
- Make direct diagnoses
- Recommend prescription drugs
- Guarantee outcomes
- Sound like a generic chatbot

Always conclude your reply with a clear, respectful note that this is not medical advice.
"""

FALLBACK_MESSAGE = (
    "⚠️ I'm not sure I can confidently answer that based on the information available. "
    "It's best to consult a licensed healthcare provider for this particular concern."
)

# Session memory buffer (clears each session run)
conversation_history = []
# Holds memory of the patient's initial context for this session
cached_patient_context = {}

def format_history():
    formatted = ""
    for turn in conversation_history[-5:]:  # Limit to last 5 turns for now
        formatted += f"👤 User: {turn['user']}\n🧠 Nurse: {turn['ai']}\n"
    return formatted

def generate_empathy_tone(symptoms):
    if not symptoms:
        return ""

    lower_symptoms = [s.lower() for s in symptoms]
    if any(s in lower_symptoms for s in ["fever", "chills", "body ache", "headache"]):
        return "I know that kind of discomfort can really wear you down. Let’s manage it safely."
    if any(s in lower_symptoms for s in ["rash", "itching", "redness"]):
        return "I understand skin issues can feel alarming. Let’s assess it calmly together."
    if any(s in lower_symptoms for s in ["nausea", "vomiting", "stomach pain"]):
        return "I know stomach issues are never pleasant. I’ll help guide you through."
    if any(s in lower_symptoms for s in ["cough", "sore throat", "cold", "flu"]):
        return "That sounds uncomfortable. Let me help you feel more in control."

    return "I’m here to support you with any concerns you’re feeling."

def is_weak_or_empty_response(text):
    if not text:
        return True
    lowered = text.lower()
    return any(phrase in lowered for phrase in [
        "i'm just an ai",
        "i cannot help with that",
        "i don't know",
        "i'm not sure",
        "as an ai",
        "i am an ai language model"
    ])

def add_soft_reassurance(response_text):
    """
    Appends a soft, calming reassurance if response mentions medical action.
    """
    if not response_text:
        return ""

    # If it already ends with a disclaimer, don't double it
    if "does not replace professional medical advice" in response_text.lower():
        return response_text

    soft_note = (
        "\n\n🤝 If you're ever unsure or your symptoms change, it's perfectly okay to check in with a doctor. "
        "You're doing the right thing by staying informed and taking care of yourself."
    )

    return response_text.strip() + soft_note

def detect_soft_risk_flag(question_or_context: str) -> str:
    """Detect red flag terms and return a nurse-style caution note if needed."""
    red_flags = [
        "chest pain", "shortness of breath", "difficulty breathing",
        "confusion", "loss of consciousness", "severe headache",
        "blurred vision", "uncontrolled bleeding", "numbness",
        "stiff neck", "blue lips", "not responding", "can't wake up"
    ]

    for flag in red_flags:
        if flag in question_or_context.lower():
            return (
                "\n⚠️ Just to be safe: Symptoms like chest pain, trouble breathing, or confusion "
                "can sometimes signal a serious issue. I recommend speaking to a doctor or visiting a clinic promptly."
            )

    return ""

def format_nurse_response(raw_response, question):
    if not raw_response:
        return "⚠️ I couldn’t generate a response right now. Please try again."

    return f"""
    {raw_response.strip()}
    """

def followup_response(question, context=None):
    global cached_patient_context

    # Update memory if context is passed
    if context:
        cached_patient_context = context

    # Safety check
    if is_unsafe_input(question):
        return (
            "⚠️ I'm sorry, but I cannot help with that request. "
            "If you're in distress or need urgent help, please contact a trusted adult, health provider, or emergency service."
        )

    # Patch vague input
    question = patch_input(question)

    try:
        model = genai.GenerativeModel("gemini-2.5-flash")

        # Build conversation memory text
        history_text = format_history()

        # Context block
        context_block = ""
        if cached_patient_context:
            context_block = (
                f"Patient Info:\n"
                f"- Name: {cached_patient_context.get('name', 'Unknown')}\n"
                f"- Age: {cached_patient_context.get('age', 'Unknown')}\n"
                f"- Sex: {cached_patient_context.get('sex', 'Unspecified')}\n"
                f"- Reported Symptoms: {', '.join(cached_patient_context.get('symptoms', []))}\n"
            )

        # Add adaptive empathy tone
        empathy_line = generate_empathy_tone(cached_patient_context.get("symptoms", []))

        patient_name = cached_patient_context.get("name", "there")
        personal_intro = f"Hi {patient_name}, I'm here to help you with that.\n"

        full_prompt = (
            f"{NURSE_SYSTEM_INSTRUCTION}\n\n"
            f"{context_block}"
            f"{empathy_line}\n\n"
            f"{personal_intro}Conversation so far:\n{history_text}"
            f"👤 User: {question.strip()}\n🧠 Nurse:"
        )

        response = model.generate_content(full_prompt)
        ai_reply = response.text.strip()

        # Check for weak/empty reply first
        if is_weak_or_empty_response(ai_reply):
            ai_reply = FALLBACK_MESSAGE
        else:
            # Add soft reassurance if it's a valid reply
            ai_reply = add_soft_reassurance(ai_reply)

            # Merge original question and context for red flag detection
            symptom_context_str = question
            if context:
                symptom_context_str += " " + " ".join(context.get("symptoms", []))

            flag_warning = detect_soft_risk_flag(symptom_context_str)
            if flag_warning:
                ai_reply += f"\n\n{flag_warning}"

        # Update history
        conversation_history.append({
            "timestamp": datetime.now().isoformat(),
            "user": question,
            "ai": ai_reply
        })

        return format_nurse_response(ai_reply, question)

    except Exception as e:
        return f"⚠️ Error generating response: {str(e)}"