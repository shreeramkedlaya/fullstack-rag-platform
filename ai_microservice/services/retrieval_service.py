from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import text
from models import DocumentChunk

class RetrievalService:
    @staticmethod
    def retrieve_relevant_chunk(db: Session, q_embed: list, query_text: str, top_k=3) -> List[dict]:
        # HYBRID SEARCH IMPLEMENTATION
        # 1. Semantic Search (with cosine distance score)
        semantic_chunks = db.query(
            DocumentChunk, 
            DocumentChunk.embedding.cosine_distance(q_embed).label('distance')
        ).order_by(
            DocumentChunk.embedding.cosine_distance(q_embed)
        ).limit(top_k).all()
        
        # 2. Keyword Search
        keyword_sql = text("""
            SELECT document_name, content, page_number, source_type, source_url FROM document_chunks 
            WHERE to_tsvector('english', content) @@ plainto_tsquery('english', :query)
            LIMIT :top_k
        """)
        keyword_results = db.execute(keyword_sql, {"query": query_text, "top_k": top_k}).fetchall()
        
        # Merge results to remove duplicates
        context_dict = {}
        
        # Add semantic chunks
        for chunk, distance in semantic_chunks:
            if chunk.content not in context_dict:
                # Convert cosine distance to similarity score (0 to 1)
                similarity_score = 1 - float(distance) if distance is not None else 0.0
                context_dict[chunk.content] = {
                    "content": chunk.content,
                    "document_name": chunk.document_name,
                    "page_number": chunk.page_number,
                    "source_type": chunk.source_type,
                    "source_url": chunk.source_url,
                    "similarity_score": round(similarity_score, 4)
                }
            
        # Add keyword chunks (if uncommented later)
        # for row in keyword_results:
        #     if row.content not in context_dict:
        #         context_dict[row.content] = {
        #             "content": row.content,
        #             "document_name": row.document_name,
        #             "page_number": row.page_number,
        #             "source_type": row.source_type,
        #             "source_url": row.source_url,
        #             "similarity_score": None # Keyword search doesn't have an exact cosine score
        #         }
            
        return list(context_dict.values())
