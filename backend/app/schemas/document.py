from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional

class DocumentResponse(BaseModel):
    id: UUID
    filename: str
    upload_date: datetime
    status: str
    page_count: int
    document_type: Optional[str] = "notes"

    model_config = ConfigDict(from_attributes=True)
