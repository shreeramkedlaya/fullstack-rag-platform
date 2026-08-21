# Backend Architecture & Performance Optimizations

This document outlines the recent architectural changes and performance optimizations made to the AI Microservice and Django backend to dramatically reduce latency and improve real-time streaming capabilities.

## 1. Django WSGI Bypass for Real-Time Streaming
**Problem:** 
The React frontend originally connected to the Django API Gateway for chat streaming. Because Django's default local development server (`runserver`) uses a synchronous WSGI implementation, it aggressively buffered the incoming text chunks from the AI Microservice. The result was that a 15-second generation stream would be held captive by Django and dumped to the UI all at once at the very end, breaking the real-time "typing" effect.

**Solution:**
We bypassed Django completely for the `/chat/stream/` endpoint. 
- **FastAPI CORS**: Enabled `CORSMiddleware` in `ai_microservice/main.py` to securely accept cross-origin requests directly from the frontend (`http://localhost:5173`).
- **Direct Connection**: The React `ChatWidget` now dials directly into the highly-asynchronous FastAPI server (`http://localhost:8001`), cutting out the middleman and allowing chunks to stream instantly.
- **Authentication**: Re-wired the `fetch` request in React to explicitly attach the `x-user-email` header, securely replacing the automatic header-injection previously handled by Django.

## 2. Singleton Design Pattern for AI Models
**Problem:**
During performance profiling, we discovered a massive bottleneck in the Python backend. The `EmbeddingService` and `LLMProvider` were being instantiated from scratch on every single incoming chat request and document ingestion. 
- Instantiating `EmbeddingService` forced the CPU to synchronously load a 90MB PyTorch neural network (`sentence-transformers/all-MiniLM-L6-v2`) from the hard drive into RAM. This blocked the entire server thread for 2-5 seconds per request.
- Instantiating `LLMProvider` forced LangChain to recreate network sessions and internal setups continuously.

**Solution:**
We implemented the **Singleton Design Pattern** in `embedding_service.py` and `llm_provider.py`. 
- The heavy PyTorch models and API clients are now initialized into memory exactly *once* when the FastAPI server boots.
- `rag_service.py` and `ingestion_service.py` were refactored to use `.get_instance()` instead of instantiating fresh objects.
- **Impact**: This instantly eliminated 2-5 seconds of pure overhead per request, ensuring the API's internal processing time is near-zero.

## 3. Frontend Artificial Typing Queue
**Problem:**
After bypassing Django, the stream successfully reached the UI. However, because Google Gemini 2.5 Flash is exceptionally fast, it generated 200+ character chunks in less than 70 milliseconds. React updated the UI instantly, completely destroying the visual "typing" illusion.

**Solution:**
We implemented a character queue in `ChatWidget.tsx`.
- As massive chunks burst in from FastAPI, they are quietly appended to a background text queue.
- A frontend `setInterval` timer pops exactly one character from the queue every 5 milliseconds and paints it to the screen. 
- This guarantees a buttery-smooth, live-streaming visual effect regardless of how fast or sporadically the LLM chunks arrive over the network.

## 4. Vector Database Indexing (Previous Phase)
**Problem:**
Cosine similarity searches on the `ai_chat_db` were performing full-table scans, causing severe latency as the number of chunks grew.

**Solution:**
We applied specialized PostgreSQL indexes:
- **HNSW Index** on the `embedding` column for ultra-fast Approximate Nearest Neighbor (ANN) vector searches.
- **GIN Index** on the `content` column for rapid Full-Text Search (keyword fallback).
- *Result*: Improved RAG retrieval speeds by ~15%, reducing the raw database query time down to ~0.015 seconds.
