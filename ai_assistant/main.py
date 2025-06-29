# ai_assistant/main.py

from fastapi import FastAPI, HTTPException, Response, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from ai_service import AIService
import pdf_service
import database_service as db

# --- 1. Initialize FastAPI Application ---
app = FastAPI(
    title="MediBridge AI Health Assistant API",
    description="API endpoints for the AI-powered virtual nurse.",
    version="1.0.0"
)

# --- CORS Middleware Configuration ---
origins = [
    "http://localhost:5173", # The address of our Vite frontend
    "http://localhost",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 2. In-Memory Session Storage ---
active_sessions = {}

# --- 3. Pydantic Data Models (Cleaned Up) ---
class StartChatRequest(BaseModel):
    user_id: str

class StartChatResponse(BaseModel):
    session_id: str

class SendMessageResponse(BaseModel):
    response: str
    esi_level: int | None

# New, simpler model for the end chat request
class EndChatRequest(BaseModel):
    session_id: str

# --- 4. API Endpoints ---

@app.post("/chat/start", response_model=StartChatResponse)
async def start_chat(request: StartChatRequest):
    """Starts a new chat session for a user."""
    service = AIService(user_id=request.user_id)
    if not service.session_id:
        raise HTTPException(status_code=500, detail="Failed to create a new session in the database.")
    active_sessions[service.session_id] = service
    return StartChatResponse(session_id=service.session_id)

@app.post("/chat/message", response_model=SendMessageResponse)
async def send_message(session_id: str = Form(...), user_message: str = Form(...), image: UploadFile = File(None)):
    """Processes a user message, which can include an optional image upload."""
    service = active_sessions.get(session_id)
    if not service:
        raise HTTPException(status_code=404, detail="Session not found or has expired. Please start a new chat.")
    
    image_bytes = None
    image_content_type = None
    if image:
        if not image.content_type or not image.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Invalid file type. Only images are allowed.")
        image_bytes = await image.read()
        image_content_type = image.content_type
        
    result = service.process_user_message(user_message, image_bytes, image_content_type)
    return SendMessageResponse(**result)

@app.post("/chat/end", status_code=204)
async def end_chat(request: EndChatRequest):
    """
    Cleans up an active session from the server's memory.
    The summary is now generated automatically when triage is complete.
    """
    service = active_sessions.get(request.session_id)
    if service:
        del active_sessions[request.session_id]
        print(f"Session {request.session_id} ended and cleaned up from memory.")
    return Response(status_code=204)

@app.get("/session/{session_id}", response_model=dict)
async def get_session(session_id: str):
    """Retrieves the core details for a single session, including all messages."""
    details = db.get_session_details(session_id)
    if not details:
        raise HTTPException(status_code=404, detail="Session not found.")
    return details

@app.get("/sessions/user/{user_id}", response_model=list[dict])
async def get_user_sessions(user_id: str):
    """Retrieves a list of all past chat sessions for a specific user."""
    sessions = db.get_sessions_for_user(user_id)
    if sessions is None:
        return []
    return sessions

@app.get("/session/{session_id}/summary/pdf")
async def get_pdf_summary(session_id: str):
    """Retrieves the summary for a given session and returns it as a PDF file."""
    session_details = db.get_session_details(session_id)
    if not session_details or not session_details.get("session_summary"):
        raise HTTPException(status_code=404, detail="Summary not found for this session. Complete the assessment first.")
    
    pdf_bytes = pdf_service.create_summary_pdf(
        summary_text=session_details["session_summary"],
        session_id=session_id,
        user_id=str(session_details["user_id"])
    )
    headers = {'Content-Disposition': f'attachment; filename="summary_{session_id}.pdf"'}
    return Response(content=pdf_bytes, media_type='application/pdf', headers=headers)

@app.delete("/session/{session_id}", status_code=204)
async def delete_session(session_id: str):
    """Deletes a specific chat session and all its associated messages."""
    if session_id in active_sessions:
        del active_sessions[session_id]
    
    db.delete_session_from_db(session_id)
    return Response(status_code=204)

# --- Run the Application ---
if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)