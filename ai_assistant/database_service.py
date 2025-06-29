# ai_assistant/database_service.py

import supabase
import uuid
from config import SUPABASE_URL, SUPABASE_KEY  # Import our credentials
from datetime import datetime

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
        sender: Who sent the message ('user' or 'bot').
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

def update_session_esi_level(session_id: str, esi_level: int):
    """Updates a session record with only the final ESI level."""
    if not supabase_client:
        return
    try:
        supabase_client.table("sessions").update({
            "final_esi_level": esi_level
        }).eq("id", session_id).execute()
        print(f"Updated session {session_id} with ESI level {esi_level}.")
    except Exception as e:
        print(f"Error updating session ESI level in database: {e}")

def update_session_summary(session_id: str, summary_text: str):
    """Updates a session record with only the final text summary."""
    if not supabase_client:
        return
    try:
        supabase_client.table("sessions").update({
            "session_summary": summary_text
        }).eq("id", session_id).execute()
        print(f"Updated session {session_id} with summary.")
    except Exception as e:
        print(f"Error updating session summary in database: {e}")


def get_session_details(session_id: str) -> dict | None:
    """Retrieves a session's details from the database."""
    if not supabase_client:
        return None
    try:
        response = supabase_client.table("sessions").select(
            "session_summary, user_id, final_esi_level"
        ).eq("id", session_id).single().execute()

        return response.data
    except Exception as e:
        print(f"Error fetching session details: {e}")
        return None
    

def upload_image(file_bytes: bytes, content_type: str) -> str | None:
    """
    Uploads an image file to the 'symptom_images' storage bucket.

    Args:
        file_bytes: The raw bytes of the image file.
        content_type: The MIME type of the file (e.g., 'image/png').

    Returns:
        The public URL of the uploaded image, or None on failure.
    """
    if not supabase_client:
        return None
    try:
        # Generate a unique filename to prevent overwrites
        file_name = f"img_{uuid.uuid4()}"
        bucket_name = "symptom-images"

        # Upload the file
        supabase_client.storage.from_(bucket_name).upload(
            file=file_bytes,
            path=file_name,
            file_options={"content-type": content_type}
        )

        # Get the public URL for the newly uploaded file
        response = supabase_client.storage.from_(bucket_name).get_public_url(file_name)
        print(f"Image uploaded. Public URL: {response}")
        return response

    except Exception as e:
        print(f"Error uploading image to Supabase Storage: {e}")
        return None


def get_session_messages(session_id: str) -> list[dict] | None:
    """Retrieves all messages for a given session, ordered by time."""
    if not supabase_client:
        return None
    try:
        response = supabase_client.table("session_messages").select(
            "sender, message_content"
        ).eq("session_id", session_id).order("timestamp", desc=False).execute()
        
        formatted_messages = [{"type": row['sender'], "text": row['message_content']} for row in response.data]
        return formatted_messages
    except Exception as e:
        print(f"Error fetching session messages: {e}")
        return None
    

def get_sessions_for_user(user_id: str) -> list[dict] | None:
    """Retrieves all sessions for a given user, ordered by most recent."""
    if not supabase_client:
        return None
    try:
        # We select the session id and when it was created.
        # We can also select the first few characters of the summary to use as a title.
        response = supabase_client.table("sessions").select(
            "id, created_at, session_summary"
        ).eq("user_id", user_id).order("created_at", desc=True).execute()

        # Format the data for the frontend
        for session in response.data:
            # Format the timestamp into a readable string
            # e.g., "Jun 28, 02:25 PM"
            dt_object = datetime.fromisoformat(session['created_at'])
            formatted_date = dt_object.strftime('%b %d, %I:%M %p')

            if session.get("session_summary"):
                # If a summary exists, use the first few words as a title
                session["title"] = session["session_summary"][:40] + "..."
            else:
                # Otherwise, use the formatted date as the title
                session["title"] = formatted_date

        return response.data
    except Exception as e:
        print(f"Error fetching sessions for user: {e}")
        return None


def delete_session_from_db(session_id: str) -> bool:
    """Deletes a session and its related messages from the database."""
    if not supabase_client:
        return False
    try:
        # Our database schema is set to "ON DELETE CASCADE",
        # so deleting a session will automatically delete all of its messages.
        response = supabase_client.table("sessions").delete().eq("id", session_id).execute()

        # The response.data will contain the deleted record. 
        # If it contains something, the deletion was successful.
        if response.data:
            print(f"Successfully deleted session {session_id}")
            return True
        print(f"No session found with ID {session_id} to delete.")
        return False
    except Exception as e:
        print(f"Error deleting session: {e}")
        return False