from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import detect

app = FastAPI(title="CivicVision AI Backend", version="1.0.0")

# Setup CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(detect.router, prefix="/api", tags=["Detection"])

@app.get("/")
def read_root():
    return {"message": "Welcome to CivicVision API. The backend is running."}

# Run with: uvicorn main:app --reload --port 8000
