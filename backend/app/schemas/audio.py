from pydantic import BaseModel
from typing import List
from uuid import UUID
from datetime import datetime

class AudioGenerateRequest(BaseModel):
    document_ids: List[UUID]

class AudioFileResponse(BaseModel):
    id: UUID
    filename: str
    duration_seconds: int | None = None
    created_at: datetime
    
    class Config:
        from_attributes = True
