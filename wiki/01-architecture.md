# 🏗️ Architecture & Tech Stack

This project uses an advanced **Microservice Architecture** featuring a decoupled React frontend, a Django Core API Gateway, and a dedicated FastAPI AI Microservice.

## 1. Core Backend API Gateway (Django)
- **Framework:** Django 5.0 + Django REST Framework (DRF)
- **Database:** MySQL (Configured for multiple databases using a custom DB router) + Redis (Session Store & Caching)
- **Authentication:** Hybrid **Opaque Token Pattern**. Long-lived JWT Refresh Tokens are locked in Redis, while short-lived `access_token` and `transaction_id` pointers are sent as secure `HttpOnly` cookies. Enforces a strict 3-device FIFO concurrency limit.
- **Microservice Proxy:** Acts as a secure API Gateway. Authenticates requests natively, then securely proxies AI-related endpoints over to the FastAPI microservice.

## 2. AI Microservice (FastAPI)
- **Framework:** FastAPI
- **Database:** PostgreSQL (SQLAlchemy + pgvector)
- **Models:** 
  - Generative: `gemini-2.5-flash`
  - Embeddings: `sentence-transformers/all-MiniLM-L6-v2`
- **Core Functionality:** Handles intensive AI tasks, including PDF document ingestion, Vector Embeddings, and Hybrid RAG Search (Semantic + Keyword).

## 3. Frontend (React)
- **Framework:** React 19 (Single Page Application)
- **Build Tool:** Vite 8
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **UI Components:** `shadcn/ui`
- **HTTP Client:** Custom Axios setup with proactive session management (silently refreshes `HttpOnly` tokens within a 2-minute buffer without interrupting the user).
