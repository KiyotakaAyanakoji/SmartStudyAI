from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from uuid import UUID
from datetime import datetime

# Summarize Schemas
class SummarizeRequest(BaseModel):
    document_id: Optional[UUID] = None
    document_ids: Optional[List[UUID]] = None

class SummarizeResponse(BaseModel):
    summary: str

# Quiz Schemas
class QuizRequest(BaseModel):
    document_id: Optional[UUID] = None
    document_ids: Optional[List[UUID]] = None
    num_questions: int = 5
    quiz_type: str = "mcq" # mcq, true_false, fill_blanks

class QuizOptions(BaseModel):
    A: str
    B: str
    C: Optional[str] = None
    D: Optional[str] = None

class QuizQuestion(BaseModel):
    question: str
    options: Optional[QuizOptions] = None
    correct_answer: str # A/B/C/D, or true/false, or the text
    explanation: Optional[str] = None
    hint: Optional[str] = None
    type: str = "mcq"

class QuizResponse(BaseModel):
    quiz: List[QuizQuestion]

class QuizSubmitRequest(BaseModel):
    document_id: Optional[UUID] = None
    document_ids: Optional[List[UUID]] = None
    quiz_type: str
    answers: List[str]
    questions: List[Dict[str, Any]]

class QuizSubmitResponse(BaseModel):
    score_percentage: float
    correct_answers: int
    total_questions: int
    weak_topics: List[str]
    strong_topics: List[str]

class QuizResultResponse(BaseModel):
    id: UUID
    document_id: UUID
    quiz_type: str
    total_questions: int
    correct_answers: int
    score_percentage: float
    weak_topics: List[str]
    strong_topics: List[str]
    created_at: datetime

class ExamReadinessResponse(BaseModel):
    readiness_percentage: float
    strong_areas: List[str]
    weak_areas: List[str]
    recommendation: str
    total_quizzes_taken: int

# Study Plan Schemas
class StudyPlanRequest(BaseModel):
    document_id: Optional[UUID] = None
    document_ids: Optional[List[UUID]] = None
    days: int = 7

class StudyPlanResponse(BaseModel):
    plan: str

# Important Questions Schemas
class ImportantQuestionsRequest(BaseModel):
    document_id: Optional[UUID] = None
    document_ids: Optional[List[UUID]] = None
    question_type: str = "all"
    num_questions: int = 5

class ImportantQuestionsResponse(BaseModel):
    questions: Any

# Paper Analysis Schemas
class PaperAnalysisRequest(BaseModel):
    document_id: UUID

class PaperAnalysisResponse(BaseModel):
    analysis: Any
