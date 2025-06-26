def ethical_response(symptoms, severity, advice):
    # Normalize input
    normalized_symptoms = [s.lower() for s in symptoms]
    severity = (severity or "").lower()

    red_flag_symptoms = {
        "chest pain",
        "shortness of breath",
        "loss of consciousness",
        "uncontrolled bleeding",
        "seizure",
        "stroke",
        "numbness",
        "slurred speech",
        "severe abdominal pain",
        "suicidal thoughts",
        "blurred vision",
        "confusion",
        "high fever in infant"
    }

    emergency_detected = False

    # Combine symptoms into phrases for better detection
    joined = " ".join(normalized_symptoms)

    for flag in red_flag_symptoms:
        if flag in joined or any(word in flag for word in normalized_symptoms):
            emergency_detected = True
            break

    if severity == "severe":
        emergency_detected = True

    if emergency_detected:
        emergency_advice = (
            "🚨 *Emergency Alert:*\n"
            "⚠️ Your symptoms may indicate a **life-threatening emergency**.\n"
            "🏥 Please seek **immediate medical attention** or go to the nearest emergency facility.\n\n"
            "❗ *This AI cannot provide a safe diagnosis in emergencies.*\n"
        )
        return emergency_advice, True

    # Otherwise, return filtered general advice
    return advice, False
