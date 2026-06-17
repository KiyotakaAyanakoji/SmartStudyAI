from fastapi import APIRouter
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.api.deps import SessionDep, CurrentUser
from app.models.document import Document
from app.models.chunk import Chunk
from app.models.quiz_result import QuizResult
from app.models.activity_log import ActivityLog
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class ActivityLogResponse(BaseModel):
    type: str
    description: str
    date: str

class DocumentBreakdown(BaseModel):
    filename: str
    chunks: int
    quizzes_taken: int
    avg_score: float

class AnalyticsDashboardResponse(BaseModel):
    total_documents: int
    total_chunks: int
    total_questions_asked: int
    total_quizzes_completed: int
    average_readiness_score: float
    recent_activity: List[ActivityLogResponse]
    documents_breakdown: List[DocumentBreakdown]

@router.get("/dashboard", response_model=AnalyticsDashboardResponse)
def get_analytics_dashboard(db: SessionDep, current_user: CurrentUser):
    # Total documents
    docs = db.query(Document).filter(Document.user_id == current_user.id).all()
    total_documents = len(docs)
    
    # Documents Breakdown and total chunks
    total_chunks = 0
    documents_breakdown = []
    
    for doc in docs:
        chunk_count = db.query(Chunk).filter(Chunk.document_id == doc.id).count()
        total_chunks += chunk_count
        
        quizzes = db.query(QuizResult).filter(QuizResult.document_id == doc.id).all()
        quizzes_taken = len(quizzes)
        
        avg_score = 0.0
        if quizzes_taken > 0:
            avg_score = sum(q.score_percentage for q in quizzes) / quizzes_taken
            
        documents_breakdown.append(DocumentBreakdown(
            filename=doc.filename,
            chunks=chunk_count,
            quizzes_taken=quizzes_taken,
            avg_score=round(avg_score, 1)
        ))
        
    # Total questions asked
    total_questions_asked = db.query(ActivityLog).filter(
        ActivityLog.user_id == current_user.id,
        ActivityLog.activity_type == "question"
    ).count()
    
    # Total quizzes completed
    all_quizzes = db.query(QuizResult).filter(QuizResult.user_id == current_user.id).all()
    total_quizzes_completed = len(all_quizzes)
    
    # Average readiness score across all quizzes
    average_readiness_score = 0.0
    if total_quizzes_completed > 0:
        average_readiness_score = sum(q.score_percentage for q in all_quizzes) / total_quizzes_completed
        
    # Recent activity
    recent_logs = db.query(ActivityLog).filter(
        ActivityLog.user_id == current_user.id
    ).order_by(ActivityLog.created_at.desc()).limit(10).all()
    
    recent_activity = []
    for log in recent_logs:
        # Format date nicely or just isoformat
        date_str = log.created_at.isoformat() if log.created_at else ""
        recent_activity.append(ActivityLogResponse(
            type=log.activity_type,
            description=log.description,
            date=date_str
        ))
        
    return AnalyticsDashboardResponse(
        total_documents=total_documents,
        total_chunks=total_chunks,
        total_questions_asked=total_questions_asked,
        total_quizzes_completed=total_quizzes_completed,
        average_readiness_score=round(average_readiness_score, 1),
        recent_activity=recent_activity,
        documents_breakdown=documents_breakdown
    )
