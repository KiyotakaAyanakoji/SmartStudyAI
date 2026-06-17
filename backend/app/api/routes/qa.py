import asyncio
from fastapi import HTTPException
from fastapi import APIRouter
from app.api.deps import SessionDep, CurrentUser
from app.schemas.qa import AskQuestionRequest, AskQuestionResponse
from app.services.rag_service import answer_question
from app.models.activity_log import ActivityLog

router = APIRouter()

@router.post("/ask", response_model=AskQuestionResponse)
async def ask_question(
    request: AskQuestionRequest,
    db: SessionDep,
    current_user: CurrentUser
):
    try:
        result = await asyncio.wait_for(
            asyncio.to_thread(
                lambda: answer_question(
        question=request.question,
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
        activity_type="question",
        description=f"Asked a question about {request.question[:30]}..."
    )
    db.add(activity)
    db.commit()
    
    return AskQuestionResponse(
        answer=result["answer"],
        sources=result["sources"]
    )
