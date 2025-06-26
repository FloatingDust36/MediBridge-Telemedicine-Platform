# session_logger.py

import json
import uuid
from datetime import datetime
import os

LOG_DIR = "logs"
os.makedirs(LOG_DIR, exist_ok=True)

def create_session_log(profile=None):
    """Initialize a new session dictionary"""
    return {
        "session_id": str(uuid.uuid4()),
        "start_time": datetime.now().isoformat(),
        "user_profile": profile,
        "entries": []
    }

def log_entry(session_log: dict, user_input: str, ai_reply: str, symptom_info: dict, triage: dict, reasoning: str, critical_flag=False):
    """Add a new interaction to the log"""
    session_log["entries"].append({
        "timestamp": datetime.now().isoformat(),
        "user_input": user_input,
        "ai_reply": ai_reply,
        "symptoms": symptom_info,
        "triage_result": triage,
        "reasoning": reasoning,
        "critical_flag": critical_flag
    })

def save_session_log(session_log: dict):
    """Write log to a JSON file in logs/"""
    session_id = session_log.get("session_id", "unknown")
    filename = os.path.join(LOG_DIR, f"{session_id}.json")
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(session_log, f, indent=2)
    print(f"💾 Session saved to: {filename}")