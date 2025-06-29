# ai_assistant/database_service.py

import supabase
import uuid
from config import SUPABASE_URL, SUPABASE_KEY
from datetime import datetime

# --- Initialize the Supabase Client ---
try:
    supabase_client: supabase.Client = supabase.create_client(SUPABASE_URL, SUPABASE_KEY)
    print("Successfully connected to Supabase.")
except Exception as e:
    print(f"Error connecting to Supabase: {e}")
    supabase_client = None

# --- Database Functions ---

def create_session(user_id: str) -> str | None:
    """Creates a new session record in the database for a given user."""
    if not supabase_client: return None
    try:
        response = supabase_client.table("sessions").insert({"user_id": user_id}).execute()
        if response.data:
            session_id = response.data[0]['id']
            print(f"Created new session with ID: {session_id}")
            return session_id
        return None
    except Exception as e:
        print(f"Error creating session in database: {e}")
        return None

def log_message(session_id: str, sender: str, message_content: str, image_url: str | None = None):
    """Logs a single message into the session_messages table."""
    if not supabase_client: return
    try:
        supabase_client.table("session_messages").insert({
            "session_id": session_id,
            "sender": sender,
            "message_content": message_content,
            "image_url": image_url
        }).execute()
    except Exception as e:
        print(f"Error logging message to database: {e}")

def update_session_esi_level(session_id: str, esi_level: int):
    """Updates a session record with only the final ESI level."""
    if not supabase_client: return
    try:
        supabase_client.table("sessions").update({"final_esi_level": esi_level}).eq("id", session_id).execute()
        print(f"Updated session {session_id} with ESI level {esi_level}.")
    except Exception as e:
        print(f"Error updating session ESI level in database: {e}")

def update_session_summary(session_id: str, summary_text: str):
    """Updates a session record with only the final text summary."""
    if not supabase_client: return
    try:
        supabase_client.table("sessions").update({"session_summary": summary_text}).eq("id", session_id).execute()
        print(f"Updated session {session_id} with summary.")
    except Exception as e:
        print(f"Error updating session summary in database: {e}")

def get_session_details(session_id: str) -> dict | None:
    """Retrieves all details for a session, including its message history."""
    if not supabase_client: return None
    try:
        session_response = supabase_client.table("sessions").select("session_summary, user_id, final_esi_level").eq("id", session_id).single().execute()
        if not session_response.data: return None
        session_data = session_response.data

        messages_response = supabase_client.table("session_messages").select("sender, message_content").eq("session_id", session_id).order("timestamp", desc=False).execute()
        
        # REFINEMENT: The conditional 'ai' to 'bot' logic is no longer needed.
        # The data in the database is now consistent.
        formatted_messages = [{"type": row['sender'], "text": row['message_content']} for row in messages_response.data]
        session_data['messages'] = formatted_messages
        
        return session_data
    except Exception as e:
        print(f"Error fetching session details: {e}")
        return None

def upload_image(file_bytes: bytes, content_type: str) -> str | None:
    """Uploads an image file to the 'symptom-images' storage bucket."""
    if not supabase_client: return None
    try:
        file_name = f"img_{uuid.uuid4()}"
        bucket_name = "symptom-images"
        supabase_client.storage.from_(bucket_name).upload(file=file_bytes, path=file_name, file_options={"content-type": content_type})
        response = supabase_client.storage.from_(bucket_name).get_public_url(file_name)
        return response
    except Exception as e:
        print(f"Error uploading image to Supabase Storage: {e}")
        return None

def get_sessions_for_user(user_id: str) -> list[dict] | None:
    """Retrieves all sessions for a given user, ordered by most recent."""
    if not supabase_client: return None
    try:
        # REFINEMENT: We now select final_esi_level as well to check for completion.
        response = supabase_client.table("sessions").select(
            "id, created_at, session_summary, final_esi_level"
        ).eq("user_id", user_id).order("created_at", desc=True).execute()

        for session in response.data:
            dt_object = datetime.fromisoformat(session['created_at'])
            formatted_date = dt_object.strftime('%b %d, %I:%M %p')

            # The frontend now knows if a summary is available.
            session["has_summary"] = bool(session.get("session_summary"))
            
            if session.get("session_summary"):
                session["title"] = session["session_summary"][:40] + "..."
            else:
                session["title"] = formatted_date
        
        return response.data
    except Exception as e:
        print(f"Error fetching sessions for user: {e}")
        return None

def delete_session_from_db(session_id: str) -> bool:
    """Deletes a session and its related messages from the database."""
    if not supabase_client: return False
    try:
        response = supabase_client.table("sessions").delete().eq("id", session_id).execute()
        if response.data:
            print(f"Successfully deleted session {session_id}")
            return True
        return False
    except Exception as e:
        print(f"Error deleting session: {e}")
        return False