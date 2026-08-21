from fastapi import APIRouter, Depends, UploadFile, File, Form, Header
from sqlalchemy.orm import Session
from typing import List
import tempfile
import os

from database import get_db
from services.ingestion_service import IngestionService
from services.chat_service import ChatService

router = APIRouter()

@router.post("/ingest/")
def ingest(
    files: List[UploadFile] = File(...),
    conversation_id: int = Form(None),
    x_user_email: str = Header(None),
    db: Session = Depends(get_db)
):
    total_chunks = 0
    current_con_id = conversation_id
    
    for file in files:
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
            content = file.file.read()
            tmp.write(content)
            tmp_file_path = tmp.name

        try:
            result = IngestionService.ingest_pdf(db, tmp_file_path, original_filename=file.filename)
            
            if x_user_email:
                current_con_id = ChatService.log_upload_to_chat(
                    db, 
                    current_con_id, 
                    x_user_email, 
                    file.filename, 
                    result.get("chunks_created", 0)
                )
            
            total_chunks += result.get("chunks_created", 0)
            
        finally:
            if os.path.exists(tmp_file_path):
                os.remove(tmp_file_path)
                
    return {
        "chunks_created": total_chunks,
        "conversation_id": current_con_id
    }
