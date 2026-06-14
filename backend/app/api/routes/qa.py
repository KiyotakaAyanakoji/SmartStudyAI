from fastapi import APIRouter
from app.api.deps import SessionDep, CurrentUser
from app.schemas.qa import AskQuestionRequest, AskQuestionResponse
from app.services.rag_service import answer_question

router = APIRouter()

@router.post("/ask", response_model=AskQuestionResponse)
def ask_question(
    request: AskQuestionRequest,
    db: SessionDep,
    current_user: CurrentUser
):
    result = answer_question(
        question=request.question,
        user_id=current_user.id,
        db=db
    )
    return AskQuestionResponse(
        answer=result["answer"],
        sources=result["sources"]
    )
