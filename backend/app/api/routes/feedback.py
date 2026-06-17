import logging
from fastapi import APIRouter, HTTPException
from app.schemas.feedback import FeedbackRequest
from app.services import mail_service

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/submit")
async def submit_feedback(request: FeedbackRequest):
    try:
        await mail_service.send_feedback_email(
            name=request.name,
            email=request.email,
            feedback_type=request.feedback_type,
            message=request.message,
            rating=request.rating
        )
        return {"success": True, "message": "Feedback submitted successfully"}
    except Exception as e:
        logger.error(f"Error submitting feedback: {e}")
        raise HTTPException(status_code=500, detail="Failed to submit feedback. Please try again later.")
