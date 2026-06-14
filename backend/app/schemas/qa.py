from pydantic import BaseModel
from typing import List

class AskQuestionRequest(BaseModel):
    question: str

class SourceItem(BaseModel):
    document: str
    page: int

class AskQuestionResponse(BaseModel):
    answer: str
    sources: List[SourceItem]
