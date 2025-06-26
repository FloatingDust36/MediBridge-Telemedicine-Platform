from src.nlp.ner import extract_entities
from src.advice.advice_generator import generate_advice
from src.utils.session_logger import log_session
from src.safety.ethics_guard import ethical_response
from src.vision.image_analyzer import analyze_image
from src.analytics.cluster_logger import log_symptoms
from src.logic.reasoning_engine import interpret_symptoms

class ConversationController:
    def __init__(self):
        self.memory = {
            "name": None,
            "age": None,
            "sex": None,
            "symptoms": [],
            "severity": None,
            "duration": None,
            "extra_info": None,
            "advice": None,
            "emergency": False,
            "visual_result": None
        }
        self.questions = [
            "name",
            "age",
            "sex",
            "symptoms",
            "severity",
            "duration",
            "extra_info"
        ]
        self.current_question = 0
        self.complete = False

    def next_prompt(self):
        prompts = {
            "name": "🧑 May I know your name?",
            "age": "🎂 How old are you?",
            "sex": "⚧️ What is your sex? (male, female, other)",
            "symptoms": "🩺 What symptoms are you experiencing?",
            "severity": "📶 How severe are they? (mild, moderate, severe)",
            "duration": "⏳ How long have you had these symptoms?",
            "extra_info": "📋 Do you have any other health issues you'd like to mention?"
        }
        return prompts[self.questions[self.current_question]]

    def receive_input(self, user_input):
        key = self.questions[self.current_question]

        if key == "symptoms":
            result = extract_entities(user_input)
            if result["symptoms"]:
                self.memory["symptoms"] = result["symptoms"]
                if result["severity"]:
                    self.memory["severity"] = result["severity"]
                if result["duration"]:
                    self.memory["duration"] = result["duration"]
            else:
                print("⚠️ I couldn't detect any symptoms. Please describe again.")
                return
        else:
            self.memory[key] = user_input.strip()

        while self.current_question < len(self.questions):
            next_key = self.questions[self.current_question]
            if not self.memory[next_key]:
                break
            self.current_question += 1

        if self.current_question >= len(self.questions):
            self.complete = True

            # 🔥 NEW: Log symptoms for public health trend tracking
            log_symptoms(self.memory["symptoms"])

            # Ask for image upload
            print("\n🖼️ Would you like to upload an image (rash, swelling, etc.) for visual analysis? (yes/no)")
            choice = input("🧑 ").strip().lower()
            if choice == "yes":
                print("📁 Please enter the image file path (e.g. C:/Users/you/Desktop/rash.jpg):")
                image_path = input("🧑 ").strip()
                label, score = analyze_image(image_path)
                self.memory["visual_result"] = (label, score)
                print("\n📸 Visual Analysis Complete.")

            raw_advice = generate_advice(
                symptoms=self.memory["symptoms"],
                severity=self.memory["severity"],
                duration=self.memory["duration"],
                name=self.memory["name"],
                age=self.memory["age"]
            )

            filtered_advice, emergency = ethical_response(
                symptoms=self.memory["symptoms"],
                severity=self.memory["severity"],
                advice=raw_advice
            )

            self.memory["advice"] = filtered_advice
            self.memory["emergency"] = emergency

    def is_complete(self):
        return self.complete

    def get_summary(self):
        summary = {
            "name": self.memory["name"],
            "age": self.memory["age"],
            "sex": self.memory["sex"],
            "symptoms": self.memory["symptoms"],
            "severity": self.memory["severity"],
            "duration": self.memory["duration"],
            "extra_info": self.memory["extra_info"],
            "advice": self.memory["advice"],
            "emergency": self.memory["emergency"],
            "visual_result": self.memory["visual_result"]
        }

        print("\n📋 FINAL ASSESSMENT REPORT")
        print("-------------------------------")
        print(f"🙍 Patient Name: {summary['name']}")
        print(f"🎂 Age: {summary['age']} | ⚧️ Sex: {summary['sex']}\n")

        print(f"🩺 Reported Symptoms: {', '.join(summary['symptoms'])}")
        print(f"📶 Severity Level: {summary['severity'].capitalize() if summary['severity'] else 'Unknown'}")
        print(f"⏳ Duration: {summary['duration'] or 'Not specified'}")
        print(f"📂 Additional Notes: {summary['extra_info'] or 'None provided'}")

        # 🧠 New: Interpretation Layer
        reasoning = interpret_symptoms(summary["symptoms"])
        summary["reasoning"] = reasoning
        print("\n🧠 Symptom Interpretation:")
        print(reasoning)

        if summary["emergency"]:
            print("\n🚨 EMERGENCY DETECTED!")
            print("-------------------------------")
            print(summary["advice"])
        else:
            print("\n🧠 AI Health Guidance:")
            print(summary["advice"])

        if summary["visual_result"]:
            label, score = summary["visual_result"]
            print("\n🖼️ Visual Symptom Analysis:")
            print("🖼️ Visual Analysis Result:")
            print(f"🔍 Predicted Condition: **{label}**")
            print(f"📊 Confidence Score: {round(score, 2)}")
            print("\n⚠️ *This result is an AI prediction and **not** a diagnosis.* "
                  "Consult a healthcare provider for clinical decisions.")

        print("-------------------------------")
        log_session(summary)
        return summary
