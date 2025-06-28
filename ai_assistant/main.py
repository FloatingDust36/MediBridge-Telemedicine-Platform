# ai_assistant/main.py

from fastapi import FastAPI, HTTPException, Response, UploadFile, File, Form
from pydantic import BaseModel
import uvicorn
from ai_service import AIService
import pdf_service
import database_service as db # Add alias to db for consistency

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
async def send_message(
    session_id: str = Form(...),
    user_message: str = Form(...),
    image: UploadFile = File(None)
):
    """
    Processes a user message, which can include an optional image upload.
    This endpoint uses multipart/form-data.
    """
    service = active_sessions.get(session_id)
    if not service:
        raise HTTPException(status_code=404, detail="Session not found.")

    image_bytes = None
    image_content_type = None
    if image:
        # Ensure the uploaded file is an image
        if not image.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Invalid file type. Only images are allowed.")
        image_bytes = await image.read()
        image_content_type = image.content_type

    result = service.process_user_message(user_message, image_bytes, image_content_type)
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


@app.get("/session/{session_id}/summary/pdf")
async def get_pdf_summary(session_id: str):
    """
    Retrieves the summary for a given session and returns it as a PDF file.
    """
    # 1. Fetch session details from the database
    session_details = db.get_session_details(session_id)
    if not session_details or not session_details.get("session_summary"):
        raise HTTPException(status_code=404, detail="Summary not found for this session.")

    # 2. Generate the PDF using the PDF service
    pdf_bytes = pdf_service.create_summary_pdf(
        summary_text=session_details["session_summary"],
        session_id=session_id,
        user_id=str(session_details["user_id"])
    )

    # 3. Return the PDF as a downloadable file
    headers = {
        'Content-Disposition': f'attachment; filename="summary_{session_id}.pdf"'
    }
    return Response(content=pdf_bytes, media_type='application/pdf', headers=headers)

# --- 5. Run the Application ---
# This block allows you to run the API directly from the command line
# using 'python main.py'. It's mainly for development.
if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)