# ai_assistant/ai_service.py

import google.generativeai as genai
import re
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
            model_name="gemini-2.5-flash",
            system_instruction=TRIAGE_SYSTEM_PROMPT
        )
        self.chat = self.model.start_chat(history=[])
        self.session_id = db.create_session(self.user_id)
        print(f"New AI Service initialized for user {self.user_id} with session {self.session_id}")

    def process_user_message(self, user_message: str, image: Image.Image | None = None) -> dict:
        """
        Processes a user's message, gets a response, and checks if the
        initial triage has been completed.
        """
        if not self.session_id:
            return {"error": "Failed to create or retrieve a database session."}

        db.log_message(self.session_id, 'user', user_message)

        try:
            chat_input = [user_message]
            if image:
                chat_input.append(image)

            response = self.chat.send_message(chat_input)
            ai_response_text = response.text

        except Exception as e:
            print(f"Error communicating with Gemini API: {e}")
            ai_response_text = "I'm sorry, I'm having connection issues at the moment. Please try again shortly."

        db.log_message(self.session_id, 'ai', ai_response_text)

        esi_level = self._parse_and_log_esi_level(ai_response_text)

        return {
            "response": ai_response_text,
            "esi_level": esi_level  # This will be the number (e.g., 3) or None
        }

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