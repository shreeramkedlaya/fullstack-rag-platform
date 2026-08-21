import os
from sqlalchemy.orm import Session
from models import DocumentChunk
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from .embedding_service import EmbeddingService

class IngestionService:
    @staticmethod
    def ingest_pdf(db: Session, file_path: str, original_filename: str = None):
        loader = PyPDFLoader(file_path)
        documents = loader.load()

        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            add_start_index=True
        )
        chunks = text_splitter.split_documents(documents)
        
        embedding_service = EmbeddingService.get_instance()
        document_name = original_filename if original_filename else os.path.basename(file_path)
        
        entities_to_create = []

        for index, chunk in enumerate(chunks):
            vector = embedding_service.get_embedding(chunk.page_content)
            
            entity = DocumentChunk(
                document_name=document_name,
                chunk_index=index,
                content=chunk.page_content,
                embedding=vector,
                page_number=chunk.metadata.get("page", None),
                source_type="pdf",
                source_url=file_path
            )
            entities_to_create.append(entity)
            
        db.add_all(entities_to_create)
        db.commit()
        
        return {
            "chunks_created": len(entities_to_create),
            "document_name": document_name
        }
