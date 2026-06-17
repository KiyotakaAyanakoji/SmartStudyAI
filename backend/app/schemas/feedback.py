from pydantic import BaseModel, EmailStr, Field

class FeedbackRequest(BaseModel):
    name: str = Field(..., min_length=2)
    email: EmailStr
    feedback_type: str = Field(..., description="bug, suggestion, compliment, other")
    message: str = Field(..., min_length=20)
    rating: int = Field(..., ge=1, le=5)
