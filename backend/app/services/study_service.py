import logging
import json
import uuid
import google.generativeai as genai
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.core.config import settings
from app.models.document import Document
from app.models.chunk import Chunk

logger = logging.getLogger(__name__)

# Configure Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-flash-latest")

def _get_document_content(document_id: uuid.UUID, user_id: uuid.UUID, db: Session) -> str:
    """Helper to fetch document and its chunks, verifying ownership."""
    # Verify ownership
    document = db.query(Document).filter(Document.id == document_id, Document.user_id == user_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found or access denied")
        
    # Fetch all chunks ordered by index to reconstruct document
    chunks = db.query(Chunk).filter(Chunk.document_id == document_id).order_by(Chunk.chunk_index).all()
    if not chunks:
        raise HTTPException(status_code=400, detail="Document has no content or is not processed yet")
        
    # Combine content
    content = "\n".join([chunk.chunk_text for chunk in chunks])
    return content

def generate_summary(document_id: uuid.UUID, user_id: uuid.UUID, db: Session) -> str:
    content = _get_document_content(document_id, user_id, db)
    
    prompt = f"""You are a study assistant. Summarize the following document in clear 
bullet points that a student can easily understand and revise from.

Document content: {content}"""

    logger.info(f"Generating summary for document {document_id}")
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        logger.error(f"Failed to generate summary: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate summary via AI")

def generate_quiz(document_id: uuid.UUID, num_questions: int, user_id: uuid.UUID, db: Session) -> list:
    content = _get_document_content(document_id, user_id, db)
    
    prompt = f"""Generate {num_questions} multiple choice questions from the content below.
Return ONLY a valid JSON array with no extra text. Each object must have:
question, options (object with A, B, C, D keys), correct_answer (A/B/C/D).

Content: {content}"""

    logger.info(f"Generating quiz ({num_questions} questions) for document {document_id}")
    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        # Clean potential markdown formatting
        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
            
        if text.endswith("```"):
            text = text[:-3]
            
        text = text.strip()
        return json.loads(text)
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse quiz JSON: {e}. Raw text: {text}")
        raise HTTPException(status_code=500, detail="Failed to parse quiz data from AI response")
    except Exception as e:
        logger.error(f"Failed to generate quiz: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate quiz via AI")

def generate_study_plan(document_id: uuid.UUID, days: int, user_id: uuid.UUID, db: Session) -> str:
    content = _get_document_content(document_id, user_id, db)
    
    prompt = f"""Create a {days}-day study plan for the following document.
Break it into clear daily goals and topics to cover each day.

Document content: {content}"""

    logger.info(f"Generating {days}-day study plan for document {document_id}")
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        logger.error(f"Failed to generate study plan: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate study plan via AI")

def generate_important_questions(document_id: uuid.UUID, user_id: uuid.UUID, db: Session) -> str:
    content = _get_document_content(document_id, user_id, db)
    
    prompt = f"""List the 10 most important questions a student must be able to answer
after studying this document. Number them clearly.

Document content: {content}"""

    logger.info(f"Generating important questions for document {document_id}")
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        logger.error(f"Failed to generate important questions: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate important questions via AI")
