# gemini_interface.py

from config import gemini_model

def send_user_message(user_message: str, history: list) -> tuple[str, list]:
    """
    Sends a user message to Gemini and returns the assistant's reply.
    """
    chat = gemini_model.start_chat(history=history)

    response = chat.send_message(user_message)
    reply = response.text

    # Update history
    history.append({"role": "user", "parts": [user_message]})
    history.append({"role": "model", "parts": [reply]})

    return reply, history