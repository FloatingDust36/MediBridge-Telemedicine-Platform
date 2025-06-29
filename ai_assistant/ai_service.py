# ai_assistant/ai_service.py

import google.generativeai as genai
import re
import io
import json
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

    def __init__(self, user_id: str):
        self.user_id = user_id
        self.model = genai.GenerativeModel("gemini-1.5-flash-latest", system_instruction=TRIAGE_SYSTEM_PROMPT)
        self.chat = self.model.start_chat(history=[])
        self.session_id = db.create_session(self.user_id)
        if self.session_id:
            db.log_message(self.session_id, 'bot', INITIAL_GREETING)
        print(f"New AI Service initialized for user {self.user_id} with session {self.session_id}")
        print(f"New AI Service initialized for user {self.user_id} with session {self.session_id}")

    async def stream_user_message(self, user_message: str, image_bytes: bytes | None = None, image_content_type: str | None = None):
        """
        Processes a user message and yields the AI's response as a stream of text chunks.
        """
        if not self.session_id:
            yield "Error: Session not found."
            return

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

            # Use stream=True to get an iterator
            response_stream = self.chat.send_message(chat_input, stream=True)

            full_response_text = ""
            for chunk in response_stream:
                # Yield each text chunk as it arrives
                yield chunk.text
                full_response_text += chunk.text

            # --- Logic after the stream is complete ---
            # Log the full response to the database
            db.log_message(self.session_id, 'bot', full_response_text)

            # Now parse the full text for the ESI level
            esi_level = self._parse_and_log_esi_level(full_response_text)

            # At the end of the stream, send a special JSON object with the final data
            if esi_level is not None:
                final_data = {"type": "triage_complete", "esi_level": esi_level}
                yield json.dumps(final_data)

        except Exception as e:
            print(f"ERROR: Could not get response from Gemini API: {e}")
            yield "Sorry, I encountered an error. Please try again."

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