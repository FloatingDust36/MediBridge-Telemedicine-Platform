# ai_assistant/database_service.py - Updated with new table names

import supabase
import uuid
import pytz
from config import SUPABASE_URL, SUPABASE_KEY
from datetime import datetime

try:
    supabase_client: supabase.Client = supabase.create_client(SUPABASE_URL, SUPABASE_KEY)
    print("Successfully connected to Supabase.")
except Exception as e:
    print(f"Error connecting to Supabase: {e}")
    supabase_client = None

def create_session(user_id: str) -> str | None:
    if not supabase_client: return None
    try:
        # CHANGED to 'ai_sessions'
        response = supabase_client.table("ai_sessions").insert({"user_id": user_id}).execute()
        if response.data:
            session_id = response.data[0]['id']
            print(f"Created new AI session with ID: {session_id}")
            return session_id
        return None
    except Exception as e:
        print(f"Error creating AI session in database: {e}")
        return None

def log_message(session_id: str, sender: str, message_content: str, image_url: str | None = None):
    if not supabase_client: return
    try:
        # CHANGED to 'ai_messages'
        supabase_client.table("ai_messages").insert({
            "session_id": session_id, "sender": sender,
            "message_content": message_content, "image_url": image_url
        }).execute()
    except Exception as e:
        print(f"Error logging AI message to database: {e}")

def update_session_esi_level(session_id: str, esi_level: int):
    if not supabase_client: return
    try:
        # CHANGED to 'ai_sessions'
        supabase_client.table("ai_sessions").update({"final_esi_level": esi_level}).eq("id", session_id).execute()
        print(f"Updated AI session {session_id} with ESI level {esi_level}.")
    except Exception as e:
        print(f"Error updating AI session ESI level: {e}")

def update_session_summary(session_id: str, summary_text: str):
    if not supabase_client: return
    try:
        # CHANGED to 'ai_sessions'
        supabase_client.table("ai_sessions").update({
            "session_summary": summary_text,
            "has_summary": True # Also mark that a summary now exists
        }).eq("id", session_id).execute()
        print(f"Updated AI session {session_id} with summary.")
    except Exception as e:
        print(f"Error updating AI session summary: {e}")

def get_session_details(session_id: str) -> dict | None:
    if not supabase_client: return None
    try:
        # CHANGED to 'ai_sessions'
        session_response = supabase_client.table("ai_sessions").select("session_summary, user_id, final_esi_level").eq("id", session_id).single().execute()
        if not session_response.data: return None
        session_data = session_response.data

        # CHANGED to 'ai_messages'
        messages_response = supabase_client.table("ai_messages").select("sender, message_content, image_url").eq("session_id", session_id).order("timestamp", desc=False).execute()

        session_data['messages'] = [
            {"type": row['sender'], "text": row['message_content'], "imageUrl": row.get('image_url')} 
            for row in messages_response.data
        ]
        return session_data
    except Exception as e:
        print(f"Error fetching AI session details: {e}")
        return None

def get_sessions_for_user(user_id: str) -> list[dict] | None:
    if not supabase_client: return None
    try:
        # CHANGED to 'ai_sessions'
        response = supabase_client.table("ai_sessions").select("id, created_at, session_summary, final_esi_level, has_summary").eq("user_id", user_id).order("created_at", desc=True).execute()

        for session in response.data:
            utc_dt = datetime.fromisoformat(session['created_at'])
            local_tz = pytz.timezone("Asia/Manila")
            local_dt = utc_dt.astimezone(local_tz)
            formatted_date = local_dt.strftime('%b %d, %I:%M %p')

            if session.get("session_summary"):
                session["title"] = session["session_summary"][:40] + "..."
            else:
                session["title"] = formatted_date

        return response.data
    except Exception as e:
        print(f"Error fetching AI sessions for user: {e}")
        return None

def delete_session_from_db(session_id: str) -> bool:
    if not supabase_client: return False
    try:
        # CHANGED to 'ai_sessions'
        response = supabase_client.table("ai_sessions").delete().eq("id", session_id).execute()
        return bool(response.data)
    except Exception as e:
        print(f"Error deleting AI session: {e}")
        return False

# The upload_image function does not need changes as it uses its own bucket.
def upload_image(file_bytes: bytes, content_type: str) -> str | None:
    if not supabase_client: return None
    try:
        file_name = f"img_{uuid.uuid4()}"
        bucket_name = "symptom-images"
        supabase_client.storage.from_(bucket_name).upload(file=file_bytes, path=file_name, file_options={"content-type": content_type})
        return supabase_client.storage.from_(bucket_name).get_public_url(file_name)
    except Exception as e:
        print(f"Error uploading image to Supabase Storage: {e}")
        return None