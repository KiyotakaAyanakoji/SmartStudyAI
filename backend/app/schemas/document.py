from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime

class DocumentResponse(BaseModel):
    id: UUID
    filename: str
    upload_date: datetime
    status: str
    page_count: int

    model_config = ConfigDict(from_attributes=True)
