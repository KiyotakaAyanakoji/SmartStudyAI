import logging
import json
import uuid
import google.generativeai as genai
import google.api_core.exceptions
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.core.config import settings
from app.models.document import Document
from app.models.chunk import Chunk
from app.models.quiz_result import QuizResult

logger = logging.getLogger(__name__)

# Configure Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-flash-latest")

def _get_document_content(document_id: uuid.UUID, document_ids: list[uuid.UUID], user_id: uuid.UUID, db: Session) -> str:
    """Helper to fetch document and its chunks, verifying ownership. Handles single or multiple documents."""
    ids_to_fetch = document_ids if document_ids else ([document_id] if document_id else [])
    if not ids_to_fetch:
        raise HTTPException(status_code=400, detail="No document provided")

    combined_content = []
    
    # Dynamically limit chunks per document to avoid exceeding Gemini token limits and causing infinite hangs
    max_chunks_per_doc = max(1, 20 // len(ids_to_fetch))
    
    for doc_id in ids_to_fetch:
        document = db.query(Document).filter(Document.id == doc_id, Document.user_id == user_id).first()
        if not document:
            raise HTTPException(status_code=404, detail=f"Document {doc_id} not found or access denied")
            
        # Limit chunks dynamically to prevent token limit issues
        chunks = db.query(Chunk).filter(Chunk.document_id == doc_id).order_by(Chunk.chunk_index).limit(max_chunks_per_doc).all()
        if not chunks:
            raise HTTPException(status_code=400, detail=f"Document {document.filename} has no content")
            
        chunk_text = "\n".join([chunk.chunk_text for chunk in chunks])
        combined_content.append(f"[From: {document.filename}]\n{chunk_text}\n")
        
    return "\n".join(combined_content)

def generate_summary(document_id: uuid.UUID, document_ids: list[uuid.UUID], user_id: uuid.UUID, db: Session) -> str:
    content = _get_document_content(document_id, document_ids, user_id, db)
    
    prompt = f"""You are a study assistant. Summarize the following document in clear 
bullet points that a student can easily understand and revise from.

Document content: {content}"""

    logger.info(f"Generating summary for document {document_id}")
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except google.api_core.exceptions.ResourceExhausted as e:
        logger.error(f"AI rate limit reached: {e}")
        raise HTTPException(status_code=429, detail="AI rate limit reached. Please wait 1 minute and try again.")
    except google.api_core.exceptions.DeadlineExceeded as e:
        logger.error(f"AI response timed out: {e}")
        raise HTTPException(status_code=504, detail="AI response timed out. Try with fewer documents.")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to generate summary: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate summary via AI")

def generate_quiz(document_id: uuid.UUID, document_ids: list[uuid.UUID], num_questions: int, quiz_type: str, user_id: uuid.UUID, db: Session) -> list:
    content = _get_document_content(document_id, document_ids, user_id, db)
    
    if quiz_type == "mcq":
        prompt = f"""Generate EXACTLY {num_questions} multiple choice questions from the content below.
You MUST return exactly {num_questions} questions, no more and no less.
Return ONLY a valid JSON array. Each object must have:
question, options (object with A, B, C, D keys), correct_answer (A/B/C/D), type: 'mcq'
Content: {content}"""
    elif quiz_type == "true_false":
        prompt = f"""Generate EXACTLY {num_questions} true or false questions from the content below.
You MUST return exactly {num_questions} questions, no more and no less.
Return ONLY a valid JSON array. Each object must have:
question, correct_answer (true/false), explanation, type: 'true_false'
Content: {content}"""
    elif quiz_type == "fill_blanks":
        prompt = f"""Generate EXACTLY {num_questions} fill in the blank questions from the content below.
You MUST return exactly {num_questions} questions, no more and no less.
Return ONLY a valid JSON array. Each object must have:
question (with ___ for blank), correct_answer, hint, type: 'fill_blanks'
Content: {content}"""
    else:
        raise HTTPException(status_code=400, detail="Invalid quiz type")

    logger.info(f"Generating {quiz_type} quiz ({num_questions} questions) for document {document_id}")
    try:
        response = model.generate_content(prompt, request_options={"timeout": 300})
        text = response.text.strip()
        
        if text.startswith("```json"): text = text[7:]
        elif text.startswith("```"): text = text[3:]
        if text.endswith("```"): text = text[:-3]
        text = text.strip()
        
        return json.loads(text)
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse quiz JSON: {e}. Raw text: {text}")
        raise HTTPException(status_code=500, detail="Failed to parse quiz data from AI response")
    except google.api_core.exceptions.ResourceExhausted as e:
        logger.error(f"AI rate limit reached: {e}")
        raise HTTPException(status_code=429, detail="AI rate limit reached. Please wait 1 minute and try again.")
    except google.api_core.exceptions.DeadlineExceeded as e:
        logger.error(f"AI response timed out: {e}")
        raise HTTPException(status_code=504, detail="AI response timed out. Try with fewer documents.")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to generate quiz: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate quiz via AI")

def submit_quiz(document_id: uuid.UUID, document_ids: list[uuid.UUID], quiz_type: str, answers: list, questions: list, user_id: uuid.UUID, db: Session) -> dict:
    if len(answers) != len(questions):
        raise HTTPException(status_code=400, detail="Answers length does not match questions length")
        
    total_questions = len(questions)
    correct_count = 0
    wrong_questions = []
    right_questions = []
    
    for i in range(total_questions):
        user_answer = str(answers[i]).strip().lower()
        correct_answer = str(questions[i].get("correct_answer", "")).strip().lower()
        if user_answer == correct_answer:
            correct_count += 1
            right_questions.append(questions[i].get("question"))
        else:
            wrong_questions.append({
                "question": questions[i].get("question"),
                "user_answer": answers[i],
                "correct_answer": questions[i].get("correct_answer")
            })
            
    score_percentage = (correct_count / total_questions) * 100 if total_questions > 0 else 0
    
    prompt = f"""Based on these quiz questions and the student's wrong answers,
identify weak topics and strong topics. Return ONLY a valid JSON object with keys 'weak_topics' and 'strong_topics', each containing an array of strings.
Wrong Questions and Answers: {json.dumps(wrong_questions)}
Right Questions: {json.dumps(right_questions)}"""

    weak_topics = []
    strong_topics = []
    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        if text.startswith("```json"): text = text[7:]
        elif text.startswith("```"): text = text[3:]
        if text.endswith("```"): text = text[:-3]
        text = text.strip()
        data = json.loads(text)
        weak_topics = data.get("weak_topics", [])
        strong_topics = data.get("strong_topics", [])
    except google.api_core.exceptions.ResourceExhausted as e:
        logger.error(f"AI rate limit reached: {e}")
        raise HTTPException(status_code=429, detail="AI rate limit reached. Please wait 1 minute and try again.")
    except google.api_core.exceptions.DeadlineExceeded as e:
        logger.error(f"AI response timed out: {e}")
        raise HTTPException(status_code=504, detail="AI response timed out. Try with fewer documents.")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to extract topics: {e}")
        
    ids_to_save = document_ids if document_ids else ([document_id] if document_id else [])
    primary_doc_id = ids_to_save[0] if ids_to_save else None

    quiz_result = QuizResult(
        user_id=user_id,
        document_id=primary_doc_id,
        document_ids=[str(i) for i in ids_to_save],
        quiz_type=quiz_type,
        total_questions=total_questions,
        correct_answers=correct_count,
        score_percentage=score_percentage,
        weak_topics=weak_topics,
        strong_topics=strong_topics
    )
    db.add(quiz_result)
    db.commit()
    db.refresh(quiz_result)
    
    return {
        "score_percentage": score_percentage,
        "correct_answers": correct_count,
        "total_questions": total_questions,
        "weak_topics": weak_topics,
        "strong_topics": strong_topics
    }

def get_exam_readiness(document_id: uuid.UUID, user_id: uuid.UUID, db: Session) -> dict:
    results = db.query(QuizResult).filter(QuizResult.document_id == document_id, QuizResult.user_id == user_id).all()
    if not results:
        raise HTTPException(status_code=404, detail="No quiz results found for this document")
        
    total_score = sum([r.score_percentage for r in results])
    avg_score = total_score / len(results)
    
    all_weak_topics = []
    all_strong_topics = []
    for r in results:
        if r.weak_topics: all_weak_topics.extend(r.weak_topics)
        if r.strong_topics: all_strong_topics.extend(r.strong_topics)
        
    prompt = f"""A student has completed multiple quizzes on a document.
Average score: {avg_score:.2f}%.
Weak topics: {list(set(all_weak_topics))}
Strong topics: {list(set(all_strong_topics))}
Generate a brief exam readiness report with recommendations.
Return ONLY a valid JSON object with keys:
readiness_percentage (float, e.g., 78.5), strong_areas (array of strings), weak_areas (array of strings), recommendation (string)."""

    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        if text.startswith("```json"): text = text[7:]
        elif text.startswith("```"): text = text[3:]
        if text.endswith("```"): text = text[:-3]
        text = text.strip()
        data = json.loads(text)
        data["total_quizzes_taken"] = len(results)
        return data
    except google.api_core.exceptions.ResourceExhausted as e:
        logger.error(f"AI rate limit reached: {e}")
        raise HTTPException(status_code=429, detail="AI rate limit reached. Please wait 1 minute and try again.")
    except google.api_core.exceptions.DeadlineExceeded as e:
        logger.error(f"AI response timed out: {e}")
        raise HTTPException(status_code=504, detail="AI response timed out. Try with fewer documents.")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to generate exam readiness: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate exam readiness via AI")

def generate_study_plan(document_id: uuid.UUID, document_ids: list[uuid.UUID], days: int, user_id: uuid.UUID, db: Session) -> str:
    content = _get_document_content(document_id, document_ids, user_id, db)
    
    prompt = f"""Create a {days}-day study plan for the following document.
Break it into clear daily goals and topics to cover each day.

Document content: {content}"""

    logger.info(f"Generating {days}-day study plan for document {document_id}")
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except google.api_core.exceptions.ResourceExhausted as e:
        logger.error(f"AI rate limit reached: {e}")
        raise HTTPException(status_code=429, detail="AI rate limit reached. Please wait 1 minute and try again.")
    except google.api_core.exceptions.DeadlineExceeded as e:
        logger.error(f"AI response timed out: {e}")
        raise HTTPException(status_code=504, detail="AI response timed out. Try with fewer documents.")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to generate study plan: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate study plan via AI")

def generate_important_questions(document_id: uuid.UUID, document_ids: list[uuid.UUID], question_type: str, num_questions: int, user_id: uuid.UUID, db: Session) -> list:
    content = _get_document_content(document_id, document_ids, user_id, db)
    
    def generate_single_type(q_type: str) -> list:
        if q_type == "2_mark":
            prompt = f"""Generate EXACTLY {num_questions} important 2-mark questions from this content.
You MUST return exactly {num_questions} questions, no more and no less.
These should be definition-based or concept-check questions.
Return as ONLY a valid JSON array: [{{ "question": "...", "expected_answer": "...", "marks": 2 }}]
Content: {content}"""
        elif q_type == "5_mark":
            prompt = f"""Generate EXACTLY {num_questions} important 5-mark questions from this content.
You MUST return exactly {num_questions} questions, no more and no less.
These should require brief explanations with examples.
Return as ONLY a valid JSON array: [{{ "question": "...", "key_points": "...", "marks": 5 }}]
Content: {content}"""
        elif q_type == "10_mark":
            prompt = f"""Generate EXACTLY {num_questions} important 10-mark questions from this content.
You MUST return exactly {num_questions} questions, no more and no less.
These should be essay-type or detailed explanation questions.
Return as ONLY a valid JSON array: [{{ "question": "...", "outline": "...", "marks": 10 }}]
Content: {content}"""
        elif q_type == "viva":
            prompt = f"""Generate EXACTLY {num_questions} viva voce questions from this content.
You MUST return exactly {num_questions} questions, no more and no less.
These should test deep conceptual understanding.
Return as ONLY a valid JSON array: [{{ "question": "...", "expected_answer": "...", "marks": "viva" }}]
Content: {content}"""
        else:
            raise ValueError(f"Unknown question type: {q_type}")
            
        logger.info(f"Generating {q_type} questions for document {document_id}")
        response = model.generate_content(prompt, request_options={"timeout": 300})
        text = response.text.strip()
        if text.startswith("```json"): text = text[7:]
        elif text.startswith("```"): text = text[3:]
        if text.endswith("```"): text = text[:-3]
        text = text.strip()
        return json.loads(text)

    try:
        if question_type == "all":
            results = []
            for t in ["2_mark", "5_mark", "10_mark", "viva"]:
                try:
                    res = generate_single_type(t)
                    results.extend(res)
                except google.api_core.exceptions.ResourceExhausted as e:
                    logger.error(f"AI rate limit reached: {e}")
                    raise HTTPException(status_code=429, detail="AI rate limit reached. Please wait 1 minute and try again.")
                except google.api_core.exceptions.DeadlineExceeded as e:
                    logger.error(f"AI response timed out: {e}")
                    raise HTTPException(status_code=504, detail="AI response timed out. Try with fewer documents.")
                except HTTPException:
                    raise
                except Exception as e:
                    logger.warning(f"Failed to generate {t} questions: {e}")
            return results
        else:
            return generate_single_type(question_type)
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse important questions JSON: {e}")
        raise HTTPException(status_code=500, detail="Failed to parse important questions JSON")
    except google.api_core.exceptions.ResourceExhausted as e:
        logger.error(f"AI rate limit reached: {e}")
        raise HTTPException(status_code=429, detail="AI rate limit reached. Please wait 1 minute and try again.")
    except google.api_core.exceptions.DeadlineExceeded as e:
        logger.error(f"AI response timed out: {e}")
        raise HTTPException(status_code=504, detail="AI response timed out. Try with fewer documents.")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to generate important questions: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate important questions via AI")
