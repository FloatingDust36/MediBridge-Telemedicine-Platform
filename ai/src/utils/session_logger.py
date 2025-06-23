import json
import os
from datetime import datetime

LOG_FILE = "src/logs/triage_logs.json"

def log_session(data):
    os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)

    # Add timestamp
    data["timestamp"] = datetime.now().isoformat()

    # Load existing logs
    if os.path.exists(LOG_FILE):
        with open(LOG_FILE, "r") as f:
            logs = json.load(f)
    else:
        logs = []

    logs.append(data)

    with open(LOG_FILE, "w") as f:
        json.dump(logs, f, indent=2)
