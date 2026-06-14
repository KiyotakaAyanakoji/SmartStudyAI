import logging
import uuid
import google.generativeai as genai
from sqlalchemy.orm import Session
from app.core.config import settings
from app.services.search_service import search_similar_chunks

logger = logging.getLogger(__name__)

# Configure Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-flash-latest")

PROMPT_TEMPLATE = """You are a study assistant. Answer the question ONLY based on the context below.
If the answer is not found in the context, say exactly:
'I could not find this in your documents.'
Do not make up any information. Do not use outside knowledge.

Context:
{retrieved_chunks}

Question: {user_query}

Answer:"""

def answer_question(question: str, user_id: uuid.UUID, db: Session):
    """
    Answers a user's question using RAG with Gemini.
    """
    logger.info(f"Processing QA request for user {user_id}")
    
    try:
        # 1. Retrieve relevant chunks
        chunks = search_similar_chunks(question, user_id, db, top_k=5)
        
        # 2. Check if chunks are found
        if not chunks:
            logger.info(f"No relevant chunks found for question from user {user_id}")
            return {
                "answer": "I could not find this in your documents.",
                "sources": []
            }
            
        # 3. Build context string and source list
        context_parts = []
        sources = []
        # Use a set to track unique sources by combining filename and page number
        seen_sources = set()
        
        for chunk in chunks:
            context_parts.append(chunk['chunk_text'])
            source_key = f"{chunk['filename']}_{chunk['page_number']}"
            if source_key not in seen_sources:
                seen_sources.add(source_key)
                sources.append({
                    "document": chunk['filename'],
                    "page": chunk['page_number']
                })
                
        context_string = "\n\n---\n\n".join(context_parts)
        
        # 4. Prepare prompt
        prompt = PROMPT_TEMPLATE.format(
            retrieved_chunks=context_string,
            user_query=question
        )
        
        # 5. Call Gemini
        logger.info(f"Calling Gemini API for user {user_id}")
        response = model.generate_content(prompt)
        
        # 6. Return answer and sources
        logger.info(f"Successfully generated answer for user {user_id}")
        return {
            "answer": response.text.strip(),
            "sources": sources
        }
        
    except Exception as e:
        logger.error(f"Failed to answer question for user {user_id}: {str(e)}")
        raise e
