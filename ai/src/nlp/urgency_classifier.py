import joblib

# Load the trained pipeline
model = joblib.load("src/nlp/triage_classifier.pkl")

# Triage level to label mapping
level_labels = {
    1: "Resuscitation",
    2: "Emergency",
    3: "Urgent",
    4: "Less Urgent",
    5: "Non-Urgent"
}

def predict_urgency(symptoms: str, duration: str, severity: str) -> dict:
    # Combine into single string (same format used during training)
    combined_input = f"{symptoms} {duration} {severity}"

    # Get prediction
    prediction = model.predict([combined_input])[0]
    
    # Get prediction probabilities
    proba = model.predict_proba([combined_input])[0]
    confidence = float(round(max(proba), 2))

    return {
        "triage_level": int(prediction),
        "triage_label": level_labels[int(prediction)],
        "confidence": confidence
    }

# Example usage
if __name__ == "__main__":
    result = predict_urgency(
        symptoms="vomiting and dizziness",
        duration="1 day",
        severity="moderate"
    )
    print(result)
