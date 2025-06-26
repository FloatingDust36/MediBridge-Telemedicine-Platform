from src.ai_engine.conversation_engine import ConversationController
from src.nlp.followup_llm import followup_response
from src.utils.session_logger import get_patient_summary

def run_agent():
    print("🤖 Welcome to MediBridge Advanced AI Health Assistant.")
    print("🤝 I’ll help assess your condition. Let’s begin.\n")

    controller = ConversationController()

    while not controller.is_complete():
        prompt = controller.next_prompt()
        user_input = input(prompt + "\n🧑 ").strip()
        controller.receive_input(user_input)

    summary = controller.get_summary()

    # Only allow follow-up if a full session occurred
    if isinstance(summary, dict) and summary.get("advice"):
        print("\n💬 You may now ask follow-up questions about your condition.")
        print("💡 Type 'exit' to end the session.\n")

        while True:
            follow_up = input("🧑 ").strip().lower()
            if follow_up.lower() in ["exit", "quit", "thank you", "bye"]:
                print("👋 Take care! MediBridge is always here for you.")
                break

            reply = followup_response(follow_up, context=summary)
            print(reply)

if __name__ == "__main__":
    run_agent()