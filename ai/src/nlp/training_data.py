TRAIN_DATA = [
    # SYMPTOM-only
    ("I feel nauseous and dizzy", {
        "entities": [(7, 15, "SYMPTOM"), (20, 25, "SYMPTOM")]
    }),
    ("I've had a headache since yesterday", {
        "entities": [(12, 20, "SYMPTOM"), (27, 41, "DURATION")]
    }),
    ("My chest hurts and I can't stop coughing", {
        "entities": [(3, 14, "SYMPTOM"), (31, 39, "SYMPTOM")]
    }),

    # SYMPTOM + SEVERITY
    ("I have a mild fever", {
        "entities": [(9, 13, "SEVERITY"), (14, 19, "SYMPTOM")]
    }),
    ("Severe chest pain started this morning", {
        "entities": [(0, 6, "SEVERITY"), (7, 17, "SYMPTOM"), (27, 39, "DURATION")]
    }),
    ("Experiencing sharp abdominal pain", {
        "entities": [(14, 19, "SEVERITY"), (20, 35, "SYMPTOM")]
    }),
    ("She's got intense migraines", {
        "entities": [(11, 18, "SEVERITY"), (19, 28, "SYMPTOM")]
    }),

    # SYMPTOM + DURATION
    ("Vomiting for three days", {
        "entities": [(0, 8, "SYMPTOM"), (13, 24, "DURATION")]
    }),
    ("Cough and fever for a week", {
        "entities": [(0, 5, "SYMPTOM"), (10, 15, "SYMPTOM"), (20, 27, "DURATION")]
    }),
    ("I've been sneezing since this morning", {
        "entities": [(10, 18, "SYMPTOM"), (25, 41, "DURATION")]
    }),

    # SYMPTOM + SEVERITY + DURATION
    ("Sharp headache for 2 days", {
        "entities": [(0, 5, "SEVERITY"), (6, 14, "SYMPTOM"), (19, 25, "DURATION")]
    }),
    ("Mild back pain for about a week", {
        "entities": [(0, 4, "SEVERITY"), (5, 14, "SYMPTOM"), (19, 33, "DURATION")]
    }),
    ("Dull stomach ache since last night", {
        "entities": [(0, 4, "SEVERITY"), (5, 18, "SYMPTOM"), (25, 39, "DURATION")]
    }),
    ("Terrible cramps all day", {
        "entities": [(0, 8, "SEVERITY"), (9, 15, "SYMPTOM"), (16, 23, "DURATION")]
    }),

    # More variations
    ("Painful urination and chills", {
        "entities": [(0, 18, "SYMPTOM"), (23, 29, "SYMPTOM")]
    }),
    ("Lightheadedness and blurred vision", {
        "entities": [(0, 15, "SYMPTOM"), (20, 34, "SYMPTOM")]
    }),
    ("I've had a burning throat for 4 days", {
        "entities": [(12, 26, "SYMPTOM"), (31, 37, "DURATION")]
    }),
    ("Persistent coughing for two weeks", {
        "entities": [(0, 20, "SYMPTOM"), (25, 35, "DURATION")]
    }),
    ("I have a throbbing headache that won't go away", {
        "entities": [(9, 27, "SYMPTOM")]
    }),
]
