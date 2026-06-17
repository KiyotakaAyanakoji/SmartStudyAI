from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
import os

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.audio_file import AudioFile
from app.schemas.audio import AudioGenerateRequest, AudioFileResponse
from app.services.audio_service import generate_audio_overview

router = APIRouter()

@router.post("/generate")
def generate_audio(
    request: AudioGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return generate_audio_overview(request.document_ids, current_user.id, db)

@router.get("/list", response_model=List[AudioFileResponse])
def list_audio_files(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    files = db.query(AudioFile).filter(AudioFile.user_id == current_user.id).order_by(AudioFile.created_at.desc()).all()
    return files

@router.get("/download/{audio_id}")
def download_audio(
    audio_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    audio = db.query(AudioFile).filter(AudioFile.id == audio_id, AudioFile.user_id == current_user.id).first()
    if not audio:
        raise HTTPException(status_code=404, detail="Audio file not found")
        
    if not os.path.exists(audio.file_path):
        raise HTTPException(status_code=404, detail="Audio file missing from disk")
        
    return FileResponse(
        path=audio.file_path,
        media_type="audio/mpeg",
        filename=audio.filename
    )

@router.delete("/{audio_id}")
def delete_audio(
    audio_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    audio = db.query(AudioFile).filter(AudioFile.id == audio_id, AudioFile.user_id == current_user.id).first()
    if not audio:
        raise HTTPException(status_code=404, detail="Audio file not found")
        
    # Delete from disk
    if os.path.exists(audio.file_path):
        try:
            os.remove(audio.file_path)
        except Exception as e:
            pass # Continue to delete from DB even if disk delete fails
            
    # Delete from DB
    db.delete(audio)
    db.commit()
    
    return {"message": "Audio file deleted successfully"}
