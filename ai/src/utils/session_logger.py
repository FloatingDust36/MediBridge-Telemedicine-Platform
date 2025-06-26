import json
from datetime import datetime
from pathlib import Path
from collections import Counter

def log_session(summary: dict):
    timestamp = datetime.now().isoformat()
    summary["timestamp"] = timestamp

    # --- Session Log File ---
    log_path = Path("logs")
    log_path.mkdir(exist_ok=True)
    session_file = log_path / "session_logs.json"

    if session_file.exists():
        with open(session_file, "r", encoding="utf-8") as f:
            logs = json.load(f)
    else:
        logs = []

    logs.append(summary)

    with open(session_file, "w", encoding="utf-8") as f:
        json.dump(logs, f, indent=2)

    # --- Patient Profile File ---
    patient_key = f"{summary['name']}_{summary['age']}_{summary['sex']}".lower()
    patient_file = log_path / "patients.json"

    if patient_file.exists():
        with open(patient_file, "r", encoding="utf-8") as f:
            patients = json.load(f)
    else:
        patients = {}

    if patient_key not in patients:
        patients[patient_key] = {
            "name": summary["name"],
            "age": summary["age"],
            "sex": summary["sex"],
            "visits": 0,
            "symptom_history": [],
            "last_seen": None
        }

    # Update patient data
    patients[patient_key]["visits"] += 1
    patients[patient_key]["symptom_history"].extend(summary["symptoms"])
    patients[patient_key]["last_seen"] = timestamp

    with open(patient_file, "w", encoding="utf-8") as f:
        json.dump(patients, f, indent=2)

def get_patient_summary(name, age, sex):
    patient_key = f"{name}_{age}_{sex}".lower()
    patient_file = Path("logs") / "patients.json"

    if not patient_file.exists():
        return "❌ No patient records found."

    with open(patient_file, "r", encoding="utf-8") as f:
        patients = json.load(f)

    if patient_key not in patients:
        return "❌ No matching patient profile found."

    patient = patients[patient_key]
    freq_symptoms = Counter(patient["symptom_history"]).most_common(3)

    summary = f"""📈 Patient Profile Summary:
        🙍 Name: {patient['name']}
        🎂 Age: {patient['age']}
        ⚧️ Sex: {patient['sex']}
        🕓 Total Visits: {patient['visits']}
        📅 Last Seen: {patient['last_seen']}
        🤒 Common Symptoms: {', '.join([f"{sym} ({count}x)" for sym, count in freq_symptoms])}
        """
    return summary
