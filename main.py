import os
import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from database import engine

from routers.auth import router as auth_router
from routers.user import router as user_router
from routers.posting import router as posting_router
from routers.review import router as review_router
from integ.rag import router as ai_router
app = FastAPI()
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
configured_origins = [
    origin.strip().rstrip("/")
    for origin in os.getenv("CORS_ORIGINS", "").split(",")
    if origin.strip()
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost",
        "http://127.0.0.1",
        "http://localhost:8080",
        "http://localhost:5500",
        *configured_origins,
    ],
    allow_origin_regex=r"https://[a-z0-9-]+\.(?:web\.app|firebaseapp\.com)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(user_router)
app.include_router(posting_router)
app.include_router(review_router)
app.include_router(ai_router)

app.mount(
    "/uploads",
    StaticFiles(directory=os.path.join(BASE_DIR, "uploads")),
    name="uploads",)

logger = logging.getLogger(__name__)


@app.get("/health", tags=["health"])
def health_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except Exception as exc:
        logger.exception("Application health check failed")
        raise HTTPException(status_code=503, detail="Service unavailable") from exc
    return {"status": "ok"}
   
