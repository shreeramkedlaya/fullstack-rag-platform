from sqlalchemy.orm import Session
from models import Conversation, ChatMessage
import datetime

class ChatService:
    @staticmethod
    def get_user_conversations(db: Session, user_email: str):
        return db.query(Conversation).filter(Conversation.user_email == user_email).order_by(Conversation.updated_at.desc()).all()

    @staticmethod
    def delete_conversation(db: Session, con_id: int, user_email: str):
        conv = db.query(Conversation).filter(Conversation.id == con_id, Conversation.user_email == user_email).first()
        if conv:
            db.delete(conv)
            db.commit()
            return True
        return False

    @staticmethod
    def update_conversation_title(db: Session, con_id: int, new_title: str, user_email: str):
        conv = db.query(Conversation).filter(Conversation.id == con_id, Conversation.user_email == user_email).first()
        if conv:
            conv.title = new_title
            db.commit()
            db.refresh(conv)
            return conv
        return None

    @staticmethod
    def get_conversation_history(db: Session, con_id: int, user_email: str):
        conv = db.query(Conversation).filter(Conversation.id == con_id, Conversation.user_email == user_email).first()
        if conv:
            return db.query(ChatMessage).filter(ChatMessage.conversation_id == conv.id).order_by(ChatMessage.created_at).all()
        return []

    @staticmethod
    def log_upload_to_chat(db: Session, con_id: int | None, user_email: str, filename: str, chunks: int):
        if con_id:
            conv = db.query(Conversation).filter(Conversation.id == con_id, Conversation.user_email == user_email).first()
            if not conv:
                conv = Conversation(user_email=user_email, title=f"Uploaded {filename}")
                db.add(conv)
                db.commit()
                db.refresh(conv)
        else:
            conv = Conversation(user_email=user_email, title=f"Uploaded {filename}")
            db.add(conv)
            db.commit()
            db.refresh(conv)
            
        user_msg = ChatMessage(conversation_id=conv.id, role='user', content=f"Uploading {filename}...")
        ai_msg = ChatMessage(conversation_id=conv.id, role='assistant', content=f"Successfully uploaded and processed {filename}. Created {chunks} knowledge chunks.")
        
        db.add(user_msg)
        db.add(ai_msg)
        conv.updated_at = datetime.datetime.utcnow()
        db.commit()
        
        return conv.id
