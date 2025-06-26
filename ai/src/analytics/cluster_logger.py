import json
from pathlib import Path

def log_symptoms(symptoms: list):
    cluster_path = Path("analytics")
    cluster_path.mkdir(exist_ok=True)

    file_path = cluster_path / "symptom_clusters.json"

    if file_path.exists():
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    else:
        data = {}

    for symptom in symptoms:
        key = symptom.lower()
        if key in data:
            data[key] += 1
        else:
            data[key] = 1

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
