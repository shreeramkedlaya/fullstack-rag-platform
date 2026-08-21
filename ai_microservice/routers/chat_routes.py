from fastapi import APIRouter, Depends, HTTPException, Header
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel

from database import get_db
from services.rag_service import RagService
from services.chat_service import ChatService

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[int] = None

class RenameRequest(BaseModel):
    title: str

@router.post("/")
def chat(
    request: ChatRequest, 
    x_user_email: str = Header(None), 
    db: Session = Depends(get_db)
):
    if not x_user_email:
        raise HTTPException(status_code=401, detail="User email required in headers")
        
    result = RagService.ask(db, request.message, request.conversation_id, x_user_email)
    return result

@router.get("/conversations/")
def list_conversations(
    x_user_email: str = Header(None), 
    db: Session = Depends(get_db)
):
    if not x_user_email:
        raise HTTPException(status_code=401, detail="User email required in headers")
        
    convos = ChatService.get_user_conversations(db, x_user_email)
    return [{"id": c.id, "title": c.title, "updated_at": c.updated_at} for c in convos]

@router.get("/conversations/{id}/")
def get_conversation(
    id: int, 
    x_user_email: str = Header(None), 
    db: Session = Depends(get_db)
):
    if not x_user_email:
        raise HTTPException(status_code=401, detail="User email required in headers")
        
    messages = ChatService.get_conversation_history(db, id, x_user_email)
    return [{"id": m.id, "role": m.role, "content": m.content, "created_at": m.created_at} for m in messages]

@router.delete("/conversations/{id}/")
def delete_conversation(
    id: int, 
    x_user_email: str = Header(None), 
    db: Session = Depends(get_db)
):
    if not x_user_email:
        raise HTTPException(status_code=401, detail="User email required in headers")
        
    success = ChatService.delete_conversation(db, id, x_user_email)
    if success:
        return {"message": "Conversation deleted successfully"}
    else:
        raise HTTPException(status_code=404, detail="Conversation not found")

@router.put("/conversations/{id}/")
def rename_conversation(
    id: int, 
    request: RenameRequest,
    x_user_email: str = Header(None), 
    db: Session = Depends(get_db)
):
    if not x_user_email:
        raise HTTPException(status_code=401, detail="User email required in headers")
        
    conv = ChatService.update_conversation_title(db, id, request.title, x_user_email)
    if conv:
        return {"message": "Conversation renamed successfully"}
    else:
        raise HTTPException(status_code=404, detail="Conversation not found")
