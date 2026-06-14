from fastapi import APIRouter
from app.api.deps import SessionDep, CurrentUser
from app.schemas.search import SearchQueryRequest, SearchQueryResponse
from app.services.search_service import search_similar_chunks

router = APIRouter()

@router.post("/", response_model=SearchQueryResponse)
def search_documents(
    request: SearchQueryRequest,
    db: SessionDep,
    current_user: CurrentUser
):
    results = search_similar_chunks(
        query=request.query,
        user_id=current_user.id,
        db=db,
        top_k=5
    )
    return SearchQueryResponse(results=results)
