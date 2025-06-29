# ai_assistant/ai_service.py

import google.generativeai as genai
import re
import io
from PIL import Image

import config
import database_service as db
from prompts import TRIAGE_SYSTEM_PROMPT, SUMMARY_PROMPT, INITIAL_GREETING

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

        # If the session was created successfully, log the initial greeting from the bot
        if self.session_id:
            db.log_message(self.session_id, 'bot', INITIAL_GREETING)
            
        print(f"New AI Service initialized for user {self.user_id} with session {self.session_id}")

    def process_user_message(self, user_message: str, image_bytes: bytes | None = None, image_content_type: str | None = None) -> dict:
        """
        Processes a user's message, sends it to the AI, and parses the response.
        """
        if not self.session_id:
            return {"error": "Failed to create or retrieve a database session."}

        # 1. Prepare image for analysis if it exists
        pil_image = None
        if image_bytes and image_content_type:
            try:
                pil_image = Image.open(io.BytesIO(image_bytes))
            except Exception as e:
                print(f"ERROR: Could not process image file: {e}")
                pil_image = None
    
        # 2. Upload image and log the user's message
        image_url = None
        if image_bytes and image_content_type:
            image_url = db.upload_image(image_bytes, image_content_type)
    
        db.log_message(self.session_id, 'user', user_message, image_url)

        # 3. Send the prompt to Gemini
        try:
            chat_input = [user_message]
            if pil_image:
                chat_input.append(pil_image)
            
            response = self.chat.send_message(chat_input)
            bot_response_text = response.text

        except Exception as e:
            print(f"ERROR: Could not get response from Gemini API: {e}")
            return {"response": "I'm sorry, I'm having connection issues. Please try again.", "esi_level": None}

        # 4. Parse the response for an ESI level tag
        esi_level = self._parse_and_log_esi_level(bot_response_text)

        # 5. Log the AI's full response to the database
        db.log_message(self.session_id, 'bot', bot_response_text)

        # 6. Return the response and the parsed ESI level
        return {
            "response": bot_response_text,
            "esi_level": esi_level
        }

    def _parse_and_log_esi_level(self, text: str) -> int | None:
        """
        Uses a robust regex to find the ESI level tag. If found, it triggers
        the summary generation.
        """
        match = re.search(r"^Final ESI Level:\s*(\d+)", text, re.IGNORECASE | re.MULTILINE)
        
        if match:
            esi_level = int(match.group(1))
            print(f"ESI Level {esi_level} detected. Logging to DB.")
            db.update_session_esi_level(self.session_id, esi_level)
            
            # Automatically generate the summary as soon as triage is complete
            self._generate_and_save_summary()
            return esi_level
        return None

    def _generate_and_save_summary(self):
        """
        Generates the final summary for the entire conversation and updates the database.
        """
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
            summary_model = genai.GenerativeModel("gemini-1.5-flash-latest")
            prompt = SUMMARY_PROMPT.format(history=history_text)
            summary_response = summary_model.generate_content(prompt)
            summary_text = summary_response.text
        except Exception as e:
            print(f"Error generating summary from Gemini: {e}")
            summary_text = "Could not automatically generate summary due to a connection error."

        db.update_session_summary(self.session_id, summary_text)
        print("Session summary saved to database.")