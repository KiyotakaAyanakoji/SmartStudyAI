from fastapi import APIRouter
from app.core.config import settings

router = APIRouter()

@router.get("/")
def health_check():
    return {
        "status": "ok",
        "version": "1.0.0",
        "environment": "production" if getattr(settings, "ENVIRONMENT", "development") == "production" else "development"
    }
