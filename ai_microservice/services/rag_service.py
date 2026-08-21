from sqlalchemy.orm import Session
import datetime
import json
import time
from models import Conversation, ChatMessage
from .embedding_service import EmbeddingService
from .retrieval_service import RetrievalService
from .llm_provider import LLMProvider

class RagService:
    @staticmethod
    def ask(db: Session, msg: str, con_id: int, user_email: str):
        if con_id:
            conv = db.query(Conversation).filter(Conversation.id == con_id, Conversation.user_email == user_email).first()
            if not conv:
                conv = Conversation(user_email=user_email, title=msg[:30])
                db.add(conv)
                db.commit()
                db.refresh(conv)
        else:
            conv = Conversation(user_email=user_email, title=msg[:30])
            db.add(conv)
            db.commit()
            db.refresh(conv)
        
        user_msg = ChatMessage(conversation_id=conv.id, role='user', content=msg)
        db.add(user_msg)
        db.commit()
        
        history_msgs = db.query(ChatMessage).filter(ChatMessage.conversation_id == conv.id).order_by(ChatMessage.created_at).limit(5).all()
        history_text = "\n".join(f"{m.role}: {m.content}" for m in history_msgs)

        llm = LLMProvider.get_instance()
        
        # --- 1. Query Rewriting ---
        search_query = msg
        if history_text.strip():
            rewrite_prompt = f"""
Given the following conversation history and the user's latest question, rewrite the question to be a standalone query that can be understood without the history.
Do NOT answer the question, just rewrite it.
Conversation History:
{history_text}
Latest Question: {msg}
Standalone Question:"""
            try:
                search_query = llm.generate_fast(rewrite_prompt).strip()
                print(f"[INFO] Rewritten Query: {search_query}")
            except Exception as e:
                print(f"[WARNING] Query rewrite failed, falling back to original: {e}")

        # --- 2. Embed and Retrieve ---
        embedding_service = EmbeddingService.get_instance()
        ques_embed = embedding_service.get_embedding(search_query)

        import time
        start_retrieval = time.time()
        context_chunks = RetrievalService.retrieve_relevant_chunk(db, ques_embed, search_query) # context_chunks is now List[dict]
        retrieval_time = time.time() - start_retrieval
        print(f"\n[TIMING] DB Retrieval took: {retrieval_time:.4f} seconds")

        # --- 3. Handle Empty Retrieval ---
        if not context_chunks:
            ai_res = "I couldn't find any relevant information in the uploaded documents."
            ai_msg = ChatMessage(conversation_id=conv.id, role='assistant', content=ai_res)
            db.add(ai_msg)
            conv.updated_at = datetime.datetime.utcnow()
            db.commit()
            return {
                'conversation_id': conv.id,
                'response': ai_res,
                'sources': [],
                'timings': {'retrieval_seconds': round(retrieval_time, 4), 'llm_seconds': 0}
            }

        # --- 4. Build Context & Prompt ---
        context_text = '\n\n'.join(chunk['content'] for chunk in context_chunks)

        full_prompt = f"""
        You are a helpful AI assistant.
Conversation History:
{history_text}
Retrieved Context:
{context_text}
Current User Question:
{msg}
Instructions:
- Use the retrieved context to answer the question if it is relevant.
- If the context does not contain the answer, use your general knowledge to provide a helpful response.
- Keep the answer concise and accurate.
        """

        # --- 5. Generate Answer ---
        start_llm = time.time()
        try:
            ai_res = llm.generate(full_prompt)
        except Exception as e:
            error_str = str(e).lower()
            if "429" in error_str or "exhausted" in error_str or "quota" in error_str:
                ai_res = "⚠️ **Gemini API quota exceeded.**\n\nYour free-tier daily limit has been reached. Please try again tomorrow."
            else:
                ai_res = f"⚠️ **An error occurred:** {str(e)}"
                
        llm_time = time.time() - start_llm
        print(f"[TIMING] LLM Generation took: {llm_time:.4f} seconds\n")

        ai_msg = ChatMessage(conversation_id=conv.id, role='assistant', content=ai_res)
        db.add(ai_msg)
        conv.updated_at = datetime.datetime.utcnow()
        db.commit()
        
        return {
            'conversation_id': conv.id,
            'response': ai_res,
            'sources': context_chunks,
            'timings': {
                'retrieval_seconds': round(retrieval_time, 4),
                'llm_seconds': round(llm_time, 4)
            }
        }
