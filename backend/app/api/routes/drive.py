from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from uuid import UUID

from app.api.deps import SessionDep, CurrentUser, get_db
from app.services import drive_service
from app.schemas.drive import (
    DriveAuthUrlResponse, DriveStatusResponse, ExportResponse,
    ExportSummaryRequest, ExportStudyPlanRequest, 
    ExportQuizReportRequest, ExportAudioRequest
)
from app.models.drive_token import DriveToken
from app.models.quiz_result import QuizResult
from app.models.activity_log import ActivityLog
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/auth-url", response_model=DriveAuthUrlResponse)
def get_auth_url(current_user: CurrentUser):
    url = drive_service.get_auth_url(current_user.id)
    return DriveAuthUrlResponse(auth_url=url)

@router.get("/callback", include_in_schema=False)
def drive_callback(
    code: str = Query(...),
    state: str = Query(...),
    db: Session = Depends(get_db)
):
    logger.info(f"Received Drive callback. State: {state}, Code snippet: {code[:10]}...")
    try:
        parts = state.split("::")
        user_id = UUID(parts[0])
        code_verifier = parts[1] if len(parts) > 1 else None
        
        drive_service.exchange_code_for_tokens(code, user_id, code_verifier, db)
        logger.info(f"Successfully processed Drive callback for user {user_id}")
        # Redirect to frontend
        return RedirectResponse(url="http://localhost:5173/drive?connected=true")
    except Exception as e:
        logger.error(f"Failed to process Drive callback: {e}", exc_info=True)
        return RedirectResponse(url="http://localhost:5173/drive?error=true")

@router.get("/status", response_model=DriveStatusResponse)
def get_drive_status(current_user: CurrentUser, db: SessionDep):
    token = db.query(DriveToken).filter(DriveToken.user_id == current_user.id).first()
    return DriveStatusResponse(connected=bool(token and token.access_token))

@router.post("/export/summary", response_model=ExportResponse)
def export_summary(
    request: ExportSummaryRequest,
    current_user: CurrentUser,
    db: SessionDep
):
    filename = f"Summary - {request.document_name}.txt"
    link = drive_service.upload_text_to_drive(current_user.id, db, filename, request.summary_text)
    
    # Log activity
    db.add(ActivityLog(user_id=current_user.id, activity_type="export", description=f"Exported summary to Drive: {filename}"))
    db.commit()
    
    return ExportResponse(success=True, drive_link=link)

@router.post("/export/study-plan", response_model=ExportResponse)
def export_study_plan(
    request: ExportStudyPlanRequest,
    current_user: CurrentUser,
    db: SessionDep
):
    filename = f"Study Plan - {request.document_name}.txt"
    link = drive_service.upload_text_to_drive(current_user.id, db, filename, request.plan_text)
    
    db.add(ActivityLog(user_id=current_user.id, activity_type="export", description=f"Exported study plan to Drive: {filename}"))
    db.commit()
    
    return ExportResponse(success=True, drive_link=link)

@router.post("/export/quiz-report", response_model=ExportResponse)
def export_quiz_report(
    request: ExportQuizReportRequest,
    current_user: CurrentUser,
    db: SessionDep
):
    quiz = db.query(QuizResult).filter(QuizResult.id == request.quiz_result_id, QuizResult.user_id == current_user.id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz result not found")
        
    report_text = f"Quiz Report\n"
    report_text += f"Type: {quiz.quiz_type}\n"
    report_text += f"Score: {quiz.score_percentage}%\n"
    report_text += f"Correct Answers: {quiz.correct_answers}/{quiz.total_questions}\n\n"
    
    if quiz.strong_topics:
        report_text += "Strong Topics:\n- " + "\n- ".join(quiz.strong_topics) + "\n\n"
    if quiz.weak_topics:
        report_text += "Weak Topics:\n- " + "\n- ".join(quiz.weak_topics) + "\n\n"
        
    report_text += f"Date Taken: {quiz.created_at.strftime('%Y-%m-%d %H:%M:%S')}"
        
    filename = f"Quiz Report - {quiz.created_at.strftime('%Y%m%d')}.txt"
    link = drive_service.upload_text_to_drive(current_user.id, db, filename, report_text)
    
    db.add(ActivityLog(user_id=current_user.id, activity_type="export", description=f"Exported quiz report to Drive"))
    db.commit()
    
    return ExportResponse(success=True, drive_link=link)

@router.post("/export/audio", response_model=ExportResponse)
def export_audio(
    request: ExportAudioRequest,
    current_user: CurrentUser,
    db: SessionDep
):
    link = drive_service.upload_audio_to_drive(current_user.id, db, request.audio_id)
    db.add(ActivityLog(user_id=current_user.id, activity_type="export", description=f"Exported audio to Drive"))
    db.commit()
    return ExportResponse(success=True, drive_link=link)
