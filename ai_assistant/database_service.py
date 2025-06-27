# ai_assistant/database_service.py

import supabase
from config import SUPABASE_URL, SUPABASE_KEY  # Import our credentials

# --- Initialize the Supabase Client ---
# We create a single, reusable client instance using our credentials.
# This is more efficient than creating a new client for every request.
try:
    supabase_client: supabase.Client = supabase.create_client(SUPABASE_URL, SUPABASE_KEY)
    print("Successfully connected to Supabase.")
except Exception as e:
    print(f"Error connecting to Supabase: {e}")
    supabase_client = None

# --- Database Functions ---

def create_session(user_id: str) -> str | None:
    """
    Creates a new session record in the database for a given user.

    Args:
        user_id: The unique identifier for the user.

    Returns:
        The session_id of the newly created session, or None if it fails.
    """
    if not supabase_client:
        print("Database client not initialized.")
        return None

    try:
        response = supabase_client.table("sessions").insert({
            "user_id": user_id
        }).execute()

        # The response object contains the data for the newly inserted row
        if response.data:
            session_id = response.data[0]['id']
            print(f"Created new session with ID: {session_id}")
            return session_id
        return None
    except Exception as e:
        print(f"Error creating session in database: {e}")
        return None

def log_message(session_id: str, sender: str, message_content: str, image_url: str | None = None):
    """
    Logs a single message into the session_messages table.

    Args:
        session_id: The ID of the current session.
        sender: Who sent the message ('user' or 'ai').
        message_content: The text of the message.
        image_url: (Optional) The URL of an image if one was uploaded.
    """
    if not supabase_client:
        print("Database client not initialized.")
        return

    try:
        supabase_client.table("session_messages").insert({
            "session_id": session_id,
            "sender": sender,
            "message_content": message_content,
            "image_url": image_url
        }).execute()
        print(f"Logged message from '{sender}' to session {session_id}")
    except Exception as e:
        print(f"Error logging message to database: {e}")


def update_session(session_id: str, esi_level: int, summary_text: str):
    """
    Updates a session record with the final ESI level and a text summary.

    Args:
        session_id: The ID of the session to update.
        esi_level: The final ESI level determined by the AI.
        summary_text: The AI-generated summary of the conversation.
    """
    if not supabase_client:
        print("Database client not initialized.")
        return

    try:
        supabase_client.table("sessions").update({
            "final_esi_level": esi_level,
            "session_summary": summary_text
        }).eq("id", session_id).execute()
        print(f"Updated session {session_id} with ESI level {esi_level}.")
    except Exception as e:
        print(f"Error updating session in database: {e}")