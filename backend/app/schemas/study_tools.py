from pydantic import BaseModel
from typing import List, Dict, Any
from uuid import UUID

# Summarize Schemas
class SummarizeRequest(BaseModel):
    document_id: UUID

class SummarizeResponse(BaseModel):
    summary: str

# Quiz Schemas
class QuizRequest(BaseModel):
    document_id: UUID
    num_questions: int = 5

class QuizOptions(BaseModel):
    A: str
    B: str
    C: str
    D: str

class QuizQuestion(BaseModel):
    question: str
    options: QuizOptions
    correct_answer: str

class QuizResponse(BaseModel):
    quiz: List[QuizQuestion]

# Study Plan Schemas
class StudyPlanRequest(BaseModel):
    document_id: UUID
    days: int = 7

class StudyPlanResponse(BaseModel):
    plan: str

# Important Questions Schemas
class ImportantQuestionsRequest(BaseModel):
    document_id: UUID

class ImportantQuestionsResponse(BaseModel):
    questions: str
