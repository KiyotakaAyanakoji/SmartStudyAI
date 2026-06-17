import os
import uuid
import logging
from sqlalchemy.orm import Session
from fastapi import HTTPException
from gtts import gTTS
from mutagen.mp3 import MP3
import google.generativeai as genai
from app.models.document import Document
from app.models.chunk import Chunk
from app.models.audio_file import AudioFile
from app.models.activity_log import ActivityLog
from app.core.config import settings

logger = logging.getLogger(__name__)

# Configure Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-flash-latest')

def generate_audio_overview(document_ids: list[uuid.UUID], user_id: uuid.UUID, db: Session) -> dict:
    if not document_ids:
        raise HTTPException(status_code=400, detail="No documents provided")

    # Combine chunks from selected documents
    combined_content = []
    doc_names = []
    
    max_chunks_per_doc = max(1, 20 // len(document_ids))
    for doc_id in document_ids:
        document = db.query(Document).filter(Document.id == doc_id, Document.user_id == user_id).first()
        if not document:
            raise HTTPException(status_code=404, detail=f"Document {doc_id} not found")
        
        doc_names.append(document.filename)
        # Limit dynamically to avoid exceeding tokens and hanging
        chunks = db.query(Chunk).filter(Chunk.document_id == doc_id).order_by(Chunk.chunk_index).limit(max_chunks_per_doc).all()
        
        if chunks:
            chunk_text = "\n".join([chunk.chunk_text for chunk in chunks])
            combined_content.append(f"[From: {document.filename}]\n{chunk_text}\n")

    if not combined_content:
        raise HTTPException(status_code=400, detail="Selected documents have no content")

    content_text = "\n".join(combined_content)
    
    # Generate Script
    prompt = f"""Convert the following document content into a clear, engaging audio overview script suitable for listening.
Write it in a conversational tone as if explaining to a student.
Keep it concise (max 500 words). Do not use bullet points or special characters, write in plain flowing sentences.
Content: {content_text}"""

    try:
        response = model.generate_content(prompt)
        script = response.text.strip()
        # Clean up possible markdown or asterisks
        script = script.replace("*", "").replace("#", "")
    except Exception as e:
        logger.error(f"Error generating audio script: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate audio script")

    # Ensure audio directory exists
    user_audio_dir = os.path.join(os.getcwd(), "audio_files", str(user_id))
    os.makedirs(user_audio_dir, exist_ok=True)
    
    audio_uuid = uuid.uuid4()
    filename = f"Overview_{'_'.join([n[:10] for n in doc_names])}.mp3"
    filename = "".join([c for c in filename if c.isalpha() or c.isdigit() or c in (' ', '.', '_')]).rstrip()
    if not filename.endswith('.mp3'):
        filename += '.mp3'
        
    audio_path = os.path.join(user_audio_dir, f"{audio_uuid}.mp3")

    # Generate MP3
    try:
        tts = gTTS(text=script, lang='en', slow=False)
        tts.save(audio_path)
    except Exception as e:
        logger.error(f"Error saving audio file: {e}")
        raise HTTPException(status_code=500, detail="Failed to synthesize audio")
        
    # Get Duration
    duration = None
    try:
        audio = MP3(audio_path)
        duration = int(audio.info.length)
    except Exception as e:
        logger.warning(f"Could not get duration: {e}")

    # Save to database
    audio_record = AudioFile(
        id=audio_uuid,
        user_id=user_id,
        document_ids=[str(did) for did in document_ids],
        filename=filename,
        file_path=audio_path,
        duration_seconds=duration
    )
    db.add(audio_record)
    
    # Log Activity
    log = ActivityLog(
        user_id=user_id,
        activity_type="audio",
        description=f"Generated audio overview for {len(document_ids)} document(s)"
    )
    db.add(log)
    
    db.commit()
    db.refresh(audio_record)
    
    return {
        "audio_id": str(audio_record.id),
        "filename": audio_record.filename,
        "message": "Audio generated successfully"
    }
