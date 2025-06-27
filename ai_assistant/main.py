# ai_assistant/main.py

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
from ai_service import AIService

# --- 1. Initialize FastAPI Application ---
app = FastAPI(
    title="MediBridge AI Health Assistant API",
    description="API endpoints for the AI-powered virtual nurse.",
    version="1.0.0"
)

# --- 2. In-Memory Session Storage ---
# This dictionary will store active AI service instances.
# Key: session_id (str), Value: AIService object
# NOTE: For large-scale production, this might be replaced by a more
# persistent cache like Redis, but for now, this is perfect.
active_sessions = {}

# --- 3. Pydantic Data Models ---
# These models define the exact structure of the data your API expects
# for requests and the structure of the data it will send back in responses.
# This provides strong data validation and excellent automatic documentation.

class StartChatRequest(BaseModel):
    user_id: str

class StartChatResponse(BaseModel):
    session_id: str

class SendMessageRequest(BaseModel):
    session_id: str
    user_message: str

class SendMessageResponse(BaseModel):
    response: str
    esi_level: int | None

class EndSessionResponse(BaseModel):
    session_id: str
    summary_text: str

# --- 4. API Endpoints ---

@app.post("/chat/start", response_model=StartChatResponse)
async def start_chat(request: StartChatRequest):
    """
    Starts a new chat session for a user, initializes AI services,
    and returns a new session ID.
    """
    print(f"Received request to start chat for user: {request.user_id}")
    service = AIService(user_id=request.user_id)
    active_sessions[service.session_id] = service
    return StartChatResponse(session_id=service.session_id)


@app.post("/chat/message", response_model=SendMessageResponse)
async def send_message(request: SendMessageRequest):
    """
    Processes a new message from a user in an existing session.
    """
    service = active_sessions.get(request.session_id)
    if not service:
        raise HTTPException(status_code=404, detail="Session not found. Please start a new chat.")

    result = service.process_user_message(request.user_message)
    return SendMessageResponse(**result)


@app.post("/chat/end", response_model=EndSessionResponse)
async def end_chat(request: SendMessageRequest):
    """
    Ends a session, triggers summary generation, and cleans up resources.
    NOTE: For simplicity, this uses SendMessageRequest to get the session_id.
    """
    service = active_sessions.get(request.session_id)
    if not service:
        raise HTTPException(status_code=404, detail="Session not found.")

    summary = service.end_and_summarize_session()

    # Clean up the session from our in-memory store
    del active_sessions[request.session_id]
    print(f"Session {request.session_id} ended and cleaned up.")

    return EndSessionResponse(session_id=request.session_id, summary_text=summary)


# --- 5. Run the Application ---
# This block allows you to run the API directly from the command line
# using 'python main.py'. It's mainly for development.
if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)