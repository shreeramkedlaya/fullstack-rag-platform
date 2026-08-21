# 🧠 AI Microservice (FastAPI)

## Architecture Overview
The AI Microservice runs independently on port 8001. It handles all document ingestion and RAG (Retrieval-Augmented Generation) logic.

## 1. Document Ingestion Flow (`/chat/ingest`)
- **Action**: User uploads a PDF.
- **Processing**: The file is read, text is extracted, and split into smaller chunks (500 chars).
- **Embedding**: `sentence-transformers/all-MiniLM-L6-v2` converts text chunks into 384-dimensional vectors.
- **Storage**: Vectors are saved to PostgreSQL using the `pgvector` extension.

## 2. RAG Retrieval & Generation Flow (`/chat/`)
- **Retrieval**: User question is embedded. The `RetrievalService` performs a **Hybrid Search** (Cosine Similarity via pgvector + Full-Text Keyword Search) to find relevant document chunks.
- **Generation**: The retrieved context (tagged with filenames), the user question, and chat history are sent to `gemini-2.5-flash` via Langchain to generate a response.
