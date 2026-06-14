from fastapi import APIRouter
from app.api.deps import SessionDep, CurrentUser
from app.schemas.study_tools import (
    SummarizeRequest, SummarizeResponse,
    QuizRequest, QuizResponse,
    StudyPlanRequest, StudyPlanResponse,
    ImportantQuestionsRequest, ImportantQuestionsResponse
)
from app.services import study_service

router = APIRouter()

@router.post("/summarize", response_model=SummarizeResponse)
def summarize_document(
    request: SummarizeRequest,
    db: SessionDep,
    current_user: CurrentUser
):
    summary = study_service.generate_summary(
        document_id=request.document_id,
        user_id=current_user.id,
        db=db
    )
    return SummarizeResponse(summary=summary)

@router.post("/quiz", response_model=QuizResponse)
def generate_quiz(
    request: QuizRequest,
    db: SessionDep,
    current_user: CurrentUser
):
    quiz = study_service.generate_quiz(
        document_id=request.document_id,
        num_questions=request.num_questions,
        user_id=current_user.id,
        db=db
    )
    return QuizResponse(quiz=quiz)

@router.post("/study-plan", response_model=StudyPlanResponse)
def generate_study_plan(
    request: StudyPlanRequest,
    db: SessionDep,
    current_user: CurrentUser
):
    plan = study_service.generate_study_plan(
        document_id=request.document_id,
        days=request.days,
        user_id=current_user.id,
        db=db
    )
    return StudyPlanResponse(plan=plan)

@router.post("/important-questions", response_model=ImportantQuestionsResponse)
def generate_important_questions(
    request: ImportantQuestionsRequest,
    db: SessionDep,
    current_user: CurrentUser
):
    questions = study_service.generate_important_questions(
        document_id=request.document_id,
        user_id=current_user.id,
        db=db
    )
    return ImportantQuestionsResponse(questions=questions)
