from pydantic import BaseModel
from typing import Optional
from uuid import UUID

class ExportSummaryRequest(BaseModel):
    document_name: str
    summary_text: str

class ExportStudyPlanRequest(BaseModel):
    document_name: str
    plan_text: str

class ExportQuizReportRequest(BaseModel):
    quiz_result_id: UUID

class ExportAudioRequest(BaseModel):
    audio_id: UUID

class DriveAuthUrlResponse(BaseModel):
    auth_url: str

class DriveStatusResponse(BaseModel):
    connected: bool

class ExportResponse(BaseModel):
    success: bool
    drive_link: Optional[str] = None
