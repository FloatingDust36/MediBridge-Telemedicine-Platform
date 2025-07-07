# ai_assistant/main.py

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from ai_service import AIService
import pdf_service
import database_service as db

app = FastAPI(
    title="MediBridge AI Health Assistant API",
    description="API endpoints for the AI-powered virtual nurse.",
    version="1.0.0"
)

origins = [
    "http://localhost:5173",
    "http://localhost",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

active_sessions = {}

class StartChatRequest(BaseModel):
    user_id: str

class StartChatResponse(BaseModel):
    session_id: str

class SendMessageResponse(BaseModel):
    response: str
    esi_level: int | None

class EndChatRequest(BaseModel):
    session_id: str

@app.post("/chat/start", response_model=StartChatResponse)
async def start_chat(request: StartChatRequest):
    service = AIService(user_id=request.user_id)
    if not service.session_id:
        raise HTTPException(status_code=500, detail="Failed to create a new session in the database.")
    active_sessions[service.session_id] = service
    return StartChatResponse(session_id=service.session_id)

@app.post("/chat/message")
async def send_message(
    session_id: str = Form(...),
    user_message: str = Form(...),
    image: UploadFile = File(None)
):
    service = active_sessions.get(session_id)

    if not service:
        # ... (the code for restoring a session remains the same)
        print(f"Session {session_id} not in memory. Attempting to restore from DB.")
        session_details = db.get_session_details(session_id)
        if session_details and 'messages' in session_details:
            user_id = str(session_details["user_id"])
            service = AIService.from_existing_session(user_id, session_id, session_details['messages'])
            active_sessions[session_id] = service
        else:
            raise HTTPException(status_code=404, detail="Session not found in memory or database.")

    image_bytes = await image.read() if image else None # Use await for reading the file
    image_content_type = image.content_type if image else None

    # Use await to call the new async service function
    return await service.get_non_streamed_response(user_message, image_bytes, image_content_type)

@app.post("/chat/end", status_code=204)
async def end_chat(request: EndChatRequest):
    service = active_sessions.get(request.session_id)
    if service:
        del active_sessions[request.session_id]
        print(f"Session {request.session_id} ended and cleaned up from memory.")
    return Response(status_code=204)

@app.get("/session/{session_id}", response_model=dict)
async def get_session(session_id: str):
    details = db.get_session_details(session_id)
    if not details:
        raise HTTPException(status_code=404, detail="Session not found.")
    return details

@app.get("/sessions/user/{user_id}", response_model=list[dict])
async def get_user_sessions(user_id: str):
    sessions = db.get_sessions_for_user(user_id)
    if sessions is None:
        return []
    return sessions

@app.get("/session/{session_id}/summary/pdf")
async def get_pdf_summary(session_id: str):
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
    if session_id in active_sessions:
        del active_sessions[session_id]

    success = db.delete_session_from_db(session_id)

    if not success:
        raise HTTPException(
            status_code=404, 
            detail="Session not found or you do not have permission to delete it."
        )
    
    return Response(status_code=204)

@app.post("/session/{session_id}/generate-title", status_code=202)
async def generate_title(session_id: str):
    service = active_sessions.get(session_id)
    if not service:
        raise HTTPException(status_code=404, detail="Session not found.")
    import asyncio
    asyncio.create_task(service.generate_and_save_title())
    return {"message": "Title generation initiated."}