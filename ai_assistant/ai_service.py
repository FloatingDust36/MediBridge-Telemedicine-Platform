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

        # If the session was created successfully, log the initial greeting from the bot
        if self.session_id:
            initial_greeting = "Welcome to the MediBridge AI Health Assistant. I can help you assess your symptoms and guide you to the appropriate next steps.\n\nPlease note: I am an AI assistant, not a medical doctor. I cannot provide a diagnosis. \n\nTo begin, please describe the main symptom you are concerned about."
            db.log_message(self.session_id, 'bot', initial_greeting)
            
        print(f"New AI Service initialized for user {self.user_id} with session {self.session_id}")


    def process_user_message(self, user_message: str, image_bytes: bytes | None = None, image_content_type: str | None = None) -> dict:
        """
        Processes a user's message, sends it to the AI, and correctly parses the response for an ESI level.
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
    
        # 2. Upload image and log user's message
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

        esi_level = self.parse_and_log_esi_level(bot_response_text)

        # 5. Log the AI's full response to the database
        db.log_message(self.session_id, 'bot', bot_response_text)

        # 6. Return the response and the (now correctly parsed) ESI level
        return {
            "response": bot_response_text,
            "esi_level": esi_level
        }

    def parse_and_log_esi_level(self, text: str) -> int | None:
        """
        Uses a more robust, case-insensitive, multiline regex to find the ESI level.
        """
        # This regex now ignores case (e.g., "final esi level") and is better at handling text across multiple lines.
        match = re.search(r"^Final ESI Level:\s*(\d+)", text, re.IGNORECASE | re.MULTILINE)

        if match:
            esi_level = int(match.group(1))
            print(f"ESI Level {esi_level} detected. Logging to DB.")
            db.update_session_esi_level(self.session_id, esi_level)

            self.generate_and_save_summary()

            return esi_level
        return None

    def generate_and_save_summary(self):
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