# ai_assistant/ai_service.py

import google.generativeai as genai
import re
import json
import io
from PIL import Image

import config
import database_service as db
from prompts import TRIAGE_SYSTEM_PROMPT, SUMMARY_PROMPT

# --- Configure the Gemini Model ---
try:
    genai.configure(api_key=config.GEMINI_API_KEY)
    print("Gemini API configured successfully.")
except Exception as e:
    print(f"Error configuring Gemini API: {e}")

class AIService:
    """Manages a single user's conversation with the AI."""

    def __init__(self, user_id: str):
        """Initializes a new AI service instance for a user."""
        self.user_id = user_id
        self.model = genai.GenerativeModel(
            model_name="gemini-1.5-flash-latest",
            system_instruction=TRIAGE_SYSTEM_PROMPT
        )
        self.chat = self.model.start_chat(history=[])
        self.session_id = db.create_session(self.user_id)
        print(f"New AI Service initialized for user {self.user_id} with session {self.session_id}")

    # This is the full function that should be in your AIService class in ai_service.py

    # Replace the existing function with this DEBUG version in ai_service.py

    def process_user_message(self, user_message: str, image_bytes: bytes | None = None, image_content_type: str | None = None) -> dict:
        """
        Processes a user's message, with added print statements for debugging.
        """
        print("\n--- [DEBUG] Inside process_user_message ---")
        if not self.session_id:
            print("[DEBUG] Aborting: Session ID is missing.")
            return {"error": "Failed to create or retrieve a database session."}

        # 1. Check if image data was successfully received by this function
        print(f"[DEBUG] Raw image bytes received by service? {'Yes' if image_bytes else 'No'}")

        pil_image = None
        if image_bytes and image_content_type:
            print("[DEBUG] Attempting to create PIL Image from bytes...")
            try:
                pil_image = Image.open(io.BytesIO(image_bytes))
                print(f"[DEBUG] PIL Image created successfully. Format: {pil_image.format}, Size: {pil_image.size}")
            except Exception as e:
                print(f"[DEBUG] CRITICAL ERROR: Failed to create PIL Image: {e}")
                pil_image = None

        # 2. Upload to storage
        image_url = None
        if image_bytes and image_content_type:
            image_url = db.upload_image(image_bytes, image_content_type)

        db.log_message(self.session_id, 'user', user_message, image_url)

        # 3. Prepare the final prompt for Gemini
        try:
            chat_input = [user_message]
            if pil_image:
                print("[DEBUG] Appending PIL Image to chat_input.")
                chat_input.append(pil_image)
            else:
                print("[DEBUG] No PIL Image to append to chat_input.")

            print(f"[DEBUG] Final chat_input being sent to Gemini: {chat_input}")
            response = self.chat.send_message(chat_input)
            bot_response_text = response.text

        except Exception as e:
            print(f"[DEBUG] CRITICAL ERROR communicating with Gemini API: {e}")
            return {"response": "I'm sorry, I'm having trouble connecting right now. Please try again.", "esi_level": None}

        # The rest of the function remains the same...
        try:
            triage_data = json.loads(bot_response_text)
            esi_level = triage_data.get("esi_level")
            patient_response = triage_data.get("patient_response")
            clinical_summary = triage_data.get("clinical_summary")
            if not all([isinstance(esi_level, int), patient_response, clinical_summary]):
                raise json.JSONDecodeError("Missing required keys in JSON response.")
            db.log_message(self.session_id, 'bot', patient_response)
            db.update_session_esi_level(self.session_id, esi_level)
            db.update_session_summary(self.session_id, clinical_summary)
            return {"response": patient_response, "esi_level": esi_level}
        except json.JSONDecodeError:
            db.log_message(self.session_id, 'bot', bot_response_text)
            return {"response": bot_response_text, "esi_level": None}

    def _parse_and_log_esi_level(self, text: str) -> int | None:
        """
        Parses the ESI level from text. If found for the first time,
        it logs it to the database.
        """
        match = re.search(r"Final ESI Level:\s*(\d)", text)
        if match:
            esi_level = int(match.group(1))
            print(f"ESI Level {esi_level} detected for session {self.session_id}. Logging to DB.")
            # We do a preliminary update to store the ESI level as soon as it's known.
            db.update_session_esi_level(self.session_id, esi_level)
            return esi_level
        return None

    def end_and_summarize_session(self):
        """
        To be called when the user is finished. Generates the final summary
        for the entire conversation and updates the database.
        """
        if not self.session_id:
            print("Cannot summarize, session not found.")
            return

        print(f"Summarizing full conversation for session {self.session_id}...")

        # 1. Format the complete conversation history for the prompt
        history_text = ""
        for message in self.chat.history:
            # We need to access the text content correctly from the Parts object
            content = message.parts[0].text if message.parts else ""
            role = "Patient" if message.role == "user" else "Nurse"
            history_text += f"{role}: {content}\n"

        # 2. Call Gemini with the summary prompt
        try:
            summary_model = genai.GenerativeModel("gemini-1.5-flash-latest")
            prompt = SUMMARY_PROMPT.format(history=history_text)
            summary_response = summary_model.generate_content(prompt)
            summary_text = summary_response.text
        except Exception as e:
            print(f"Error generating summary from Gemini: {e}")
            summary_text = "Could not automatically generate summary due to a connection error."

        # 3. Update the session with the final summary
        db.update_session_summary(self.session_id, summary_text)
        print("Session summary saved to database.")
        return summary_text