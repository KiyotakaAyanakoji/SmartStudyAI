from pydantic import BaseModel
from typing import List

class SearchQueryRequest(BaseModel):
    query: str

class SearchResultItem(BaseModel):
    chunk_id: str
    chunk_text: str
    filename: str
    page_number: int

class SearchQueryResponse(BaseModel):
    results: List[SearchResultItem]
