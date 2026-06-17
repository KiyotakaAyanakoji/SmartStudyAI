import json
import logging
from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException
import google.generativeai as genai

from app.models.document import Document
from app.models.chunk import Chunk
from app.models.activity_log import ActivityLog
from app.core.config import settings

logger = logging.getLogger(__name__)

genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-flash-latest')

def analyze_previous_year_paper(document_id: UUID, user_id: UUID, db: Session) -> dict:
    document = db.query(Document).filter(Document.id == document_id, Document.user_id == user_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if document.document_type != "previous_year_paper":
        raise HTTPException(status_code=400, detail="Document must be of type 'previous_year_paper' for analysis")

    # Fetch chunks (limit 20 to prevent context size issues)
    chunks = db.query(Chunk).filter(Chunk.document_id == document_id).order_by(Chunk.chunk_index).limit(20).all()
    if not chunks:
        raise HTTPException(status_code=400, detail="Document has no processed content")

    content_text = "\n".join([chunk.chunk_text for chunk in chunks])

    prompt = f"""You are an expert exam analyst. Analyze this previous year question paper.
Identify and return a JSON object with:
{{
  "frequently_asked_topics": ["list of topics that appear multiple times"],
  "important_chapters": ["chapters with most questions"],
  "exam_trends": ["patterns you notice in question types"],
  "high_weightage_concepts": ["concepts worth most marks"],
  "question_type_breakdown": {{ "long_questions": 0, "short_questions": 0, "mcq": 0 }},
  "preparation_tips": ["specific tips based on paper pattern"]
}}

Only output valid JSON. Do not include markdown blocks like ```json ... ```.

Paper content:
{content_text}"""

    try:
        response = model.generate_content(prompt)
        result_text = response.text.strip()
        
        # Clean up if model added markdown tags
        if result_text.startswith("```json"):
            result_text = result_text[7:]
        if result_text.startswith("```"):
            result_text = result_text[3:]
        if result_text.endswith("```"):
            result_text = result_text[:-3]
            
        analysis = json.loads(result_text)
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON from Gemini: {e}")
        raise HTTPException(status_code=500, detail="Failed to analyze paper structure")
    except Exception as e:
        logger.error(f"Error during paper analysis: {e}")
        raise HTTPException(status_code=500, detail="Failed to perform analysis")

    # Log Activity
    log = ActivityLog(
        user_id=user_id,
        activity_type="paper_analysis",
        description=f"Generated paper analysis for document {document.filename}"
    )
    db.add(log)
    db.commit()

    return {"analysis": analysis}
