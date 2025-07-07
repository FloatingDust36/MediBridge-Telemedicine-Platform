# ai_assistant/ai_service.py

import google.generativeai as genai
import re
import io
import json
from PIL import Image

import config
import database_service as db
from prompts import TRIAGE_SYSTEM_PROMPT, SUMMARY_PROMPT, INITIAL_GREETING, TITLE_GENERATION_PROMPT

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
        self.model = genai.GenerativeModel("gemini-2.5-flash", system_instruction=TRIAGE_SYSTEM_PROMPT)
        self.chat = self.model.start_chat(history=[])
        self.session_id = db.create_session(self.user_id)

        # If the session was created successfully, log the initial greeting from the bot
        if self.session_id:
            db.log_message(self.session_id, 'bot', INITIAL_GREETING)
            
        print(f"New AI Service initialized for user {self.user_id} with session {self.session_id}")

    async def get_non_streamed_response(self, user_message: str, image_bytes: bytes | None = None, image_content_type: str | None = None) -> dict:
        """
        Generates a complete AI response without streaming. Returns a dictionary
        with the response text and triage completion status.
        """
        if not self.session_id:
            return {"response_text": "Error: Session not found.", "is_complete": True, "esi_level": None}

        pil_image = None
        if image_bytes and image_content_type:
            try:
                pil_image = Image.open(io.BytesIO(image_bytes))
            except Exception as e:
                print(f"ERROR: Could not process image file: {e}")

        image_url = db.upload_image(image_bytes, image_content_type) if image_bytes else None
        db.log_message(self.session_id, 'user', user_message, image_url)

        try:
            chat_input = [user_message]
            if pil_image:
                chat_input.append(pil_image)

            # Use await for the network call to the Gemini API
            full_response = await self.chat.send_message_async(chat_input)
            full_response_text = full_response.text

            esi_level = self.parse_and_log_esi_level(full_response_text)

            db.log_message(self.session_id, 'bot', full_response_text)

            if esi_level is not None:
                return {
                    "response_text": full_response_text,
                    "is_complete": True,
                    "esi_level": esi_level
                }
            else:
                return {
                    "response_text": full_response_text,
                    "is_complete": False,
                    "esi_level": None
                }

        except Exception as e:
            print(f"ERROR: Could not get response from Gemini API: {e}")
            return {"response_text": "Sorry, I encountered an error. Please try again.", "is_complete": True, "esi_level": None}


    def parse_and_log_esi_level(self, text: str) -> int | None:
        """Uses a robust regex to find the ESI level tag. If found, it triggers summary generation."""
        match = re.search(r"^Final ESI Level:\s*(\d+)", text, re.IGNORECASE | re.MULTILINE)
        
        if match:
            esi_level = int(match.group(1))
            print(f"ESI Level {esi_level} detected. Logging to DB.")
            db.update_session_esi_level(self.session_id, esi_level)
            
            self.generate_and_save_summary()
            self.generate_and_save_title()
            return esi_level
        return None

    def generate_and_save_summary(self):
        """Generates the final summary for the entire conversation and updates the database."""
        if not self.session_id:
            print("Cannot summarize, session not found.")
            return

        print(f"Summarizing full conversation for session {self.session_id}...")
        
        history_text = ""
        for message in self.chat.history:
            content = message.parts[0].text if message.parts else ""
            role = "Patient" if message.role == "user" else "Nurse"
            history_text += f"{role}: {content}\n"

        try:
            summary_model = genai.GenerativeModel("gemini-2.5-flash")
            prompt = SUMMARY_PROMPT.format(history=history_text)
            summary_response = summary_model.generate_content(prompt)
            summary_text = summary_response.text
        except Exception as e:
            print(f"Error generating summary from Gemini: {e}")
            summary_text = "Could not automatically generate summary due to a connection error."

        db.update_session_summary(self.session_id, summary_text)
        print("Session summary saved to database.")

    def generate_and_save_title(self):
        """Generates a concise title for the conversation and saves it."""
        if not self.session_id or len(self.chat.history) < 2:
            return

        print(f"Generating title for session {self.session_id}...")

        history_text = "\n".join([f"{'Patient' if m.role == 'user' else 'Nurse'}: {m.parts[0].text}" for m in self.chat.history[:4]])

        try:
            title_model = genai.GenerativeModel("gemini-2.5-flash")
            prompt = TITLE_GENERATION_PROMPT.format(history=history_text)
            title_response = title_model.generate_content(prompt)
            clean_title = title_response.text.strip().replace('"', '')
            db.update_session_title(self.session_id, clean_title)
        except Exception as e:
            print(f"Error generating title: {e}")

    @classmethod
    def from_existing_session(cls, user_id: str, session_id: str, history: list[dict]):
        """Creates an AIService instance by loading existing chat history."""
        instance = cls.__new__(cls)
        instance.user_id = user_id
        instance.session_id = session_id
        
        gemini_history = []
        for message in history:
            role = "user" if message.get('type') == 'user' else "model"
            if message.get('text'):
                gemini_history.append({'role': role, 'parts': [{'text': message['text']}]})
        
        instance.model = genai.GenerativeModel(
            "gemini-2.5-flash",
            system_instruction=TRIAGE_SYSTEM_PROMPT
        )
        instance.chat = instance.model.start_chat(history=gemini_history)
        
        print(f"Restored AI Service for user {instance.user_id} from session {instance.session_id}")
        return instance