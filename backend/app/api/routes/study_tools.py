import asyncio
from fastapi import HTTPException
from fastapi import APIRouter
from typing import List
from uuid import UUID
from app.api.deps import SessionDep, CurrentUser
from app.schemas.study_tools import (
    SummarizeRequest, SummarizeResponse,
    QuizRequest, QuizResponse,
    QuizSubmitRequest, QuizSubmitResponse,
    QuizResultResponse, ExamReadinessResponse,
    StudyPlanRequest, StudyPlanResponse,
    ImportantQuestionsRequest, ImportantQuestionsResponse
)
from app.services import study_service
from app.models.quiz_result import QuizResult
from app.models.activity_log import ActivityLog

router = APIRouter()

@router.post("/summarize", response_model=SummarizeResponse)
async def summarize_document(
    request: SummarizeRequest,
    db: SessionDep,
    current_user: CurrentUser
):
    try:
        summary = await asyncio.wait_for(
            asyncio.to_thread(
                lambda: study_service.generate_summary(
        document_id=request.document_id,
        document_ids=request.document_ids,
        user_id=current_user.id,
        db=db
    )
            ),
            timeout=90.0
        )
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="AI response timed out. Try with fewer documents.")
    
    activity = ActivityLog(
        user_id=current_user.id,
        activity_type="summary",
        description="Generated a summary for document"
    )
    db.add(activity)
    db.commit()
    
    return SummarizeResponse(summary=summary)

@router.post("/quiz", response_model=QuizResponse)
async def generate_quiz(
    request: QuizRequest,
    db: SessionDep,
    current_user: CurrentUser
):
    try:
        quiz = await asyncio.wait_for(
            asyncio.to_thread(
                lambda: study_service.generate_quiz(
        document_id=request.document_id,
        document_ids=request.document_ids,
        num_questions=request.num_questions,
        quiz_type=request.quiz_type,
        user_id=current_user.id,
        db=db
    )
            ),
            timeout=90.0
        )
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="AI response timed out. Try with fewer documents.")
    return QuizResponse(quiz=quiz)

@router.post("/quiz/submit", response_model=QuizSubmitResponse)
async def submit_quiz(
    request: QuizSubmitRequest,
    db: SessionDep,
    current_user: CurrentUser
):
    try:
        result = await asyncio.wait_for(
            asyncio.to_thread(
                lambda: study_service.submit_quiz(
        document_id=request.document_id,
        document_ids=request.document_ids,
        quiz_type=request.quiz_type,
        answers=request.answers,
        questions=request.questions,
        user_id=current_user.id,
        db=db
    )
            ),
            timeout=90.0
        )
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="AI response timed out. Try with fewer documents.")
    
    score = result.get("score_percentage", 0)
    activity = ActivityLog(
        user_id=current_user.id,
        activity_type="quiz",
        description=f"Completed quiz - {score:.0f}%"
    )
    db.add(activity)
    db.commit()
    
    return QuizSubmitResponse(**result)

@router.get("/quiz/results", response_model=List[QuizResultResponse])
def get_quiz_results(
    db: SessionDep,
    current_user: CurrentUser
):
    results = db.query(QuizResult).filter(QuizResult.user_id == current_user.id).order_by(QuizResult.created_at.desc()).all()
    return results

@router.get("/exam-readiness/{document_id}", response_model=ExamReadinessResponse)
def get_exam_readiness(
    document_id: UUID,
    db: SessionDep,
    current_user: CurrentUser
):
    readiness = study_service.get_exam_readiness(
        document_id=document_id,
        user_id=current_user.id,
        db=db
    )
    return ExamReadinessResponse(**readiness)

@router.post("/study-plan", response_model=StudyPlanResponse)
async def generate_study_plan(
    request: StudyPlanRequest,
    db: SessionDep,
    current_user: CurrentUser
):
    try:
        plan = await asyncio.wait_for(
            asyncio.to_thread(
                lambda: study_service.generate_study_plan(
        document_id=request.document_id,
        document_ids=request.document_ids,
        days=request.days,
        user_id=current_user.id,
        db=db
    )
            ),
            timeout=90.0
        )
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="AI response timed out. Try with fewer documents.")
    return StudyPlanResponse(plan=plan)

from app.services import study_service, paper_analysis_service
from app.schemas.study_tools import (
    SummarizeRequest, SummarizeResponse,
    QuizRequest, QuizResponse,
    QuizSubmitRequest, QuizSubmitResponse,
    QuizResultResponse, ExamReadinessResponse,
    StudyPlanRequest, StudyPlanResponse,
    ImportantQuestionsRequest, ImportantQuestionsResponse,
    PaperAnalysisRequest, PaperAnalysisResponse
)

@router.post("/important-questions", response_model=ImportantQuestionsResponse)
async def generate_important_questions(
    request: ImportantQuestionsRequest,
    db: SessionDep,
    current_user: CurrentUser
):
    try:
        questions = await asyncio.wait_for(
            asyncio.to_thread(
                lambda: study_service.generate_important_questions(
        document_id=request.document_id,
        document_ids=request.document_ids,
        question_type=request.question_type,
        num_questions=request.num_questions,
        user_id=current_user.id,
        db=db
    )
            ),
            timeout=90.0
        )
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="AI response timed out. Try with fewer documents.")
    return ImportantQuestionsResponse(questions=questions)

@router.post("/analyze-paper", response_model=PaperAnalysisResponse)
def analyze_paper(
    request: PaperAnalysisRequest,
    db: SessionDep,
    current_user: CurrentUser
):
    result = paper_analysis_service.analyze_previous_year_paper(
        document_id=request.document_id,
        user_id=current_user.id,
        db=db
    )
    return PaperAnalysisResponse(analysis=result["analysis"])
