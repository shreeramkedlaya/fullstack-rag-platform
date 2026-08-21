from fastapi import FastAPI
from database import Base, engine
from routers import chat_routes, ingestion_routes

# Ensure tables exist
Base.metadata.create_all(bind=engine)

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="AI Microservice")

# Allow direct requests from React frontend to bypass Django WSGI buffering
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include modular routers
app.include_router(chat_routes.router, prefix="/chat", tags=["Chat"])
app.include_router(ingestion_routes.router, prefix="/chat", tags=["Ingestion"])
