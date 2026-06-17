import os
import uuid
import shutil
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status, Form, BackgroundTasks
from pypdf import PdfReader
from sqlalchemy.orm import Session
from app.api.deps import SessionDep, CurrentUser, get_current_user, get_db
from app.models.document import Document
from app.models.user import User
from app.models.activity_log import ActivityLog
from app.schemas.document import DocumentResponse

router = APIRouter()

UPLOAD_DIR = "uploads"
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB

# Ensure base upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    document_type: str = Form("notes"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    # Read the file to check size and extract page count
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds the 20MB limit")
    
    # Save the file temporarily to read it with PyPDF
    user_upload_dir = os.path.join(UPLOAD_DIR, str(current_user.id))
    os.makedirs(user_upload_dir, exist_ok=True)
    
    doc_id = uuid.uuid4()
    file_path = os.path.join(user_upload_dir, f"{doc_id}.pdf")
    
    with open(file_path, "wb") as f:
        f.write(content)
        
    try:
        reader = PdfReader(file_path)
        page_count = len(reader.pages)
    except Exception as e:
        # Clean up if it fails
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=400, detail="Invalid PDF file")
    
    new_doc = Document(
        id=doc_id,
        user_id=current_user.id,
        filename=file.filename,
        file_path=file_path,
        page_count=page_count,
        status="processing",
        document_type=document_type
    )
    
    db.add(new_doc)
    
    # Auto-log activity
    activity = ActivityLog(
        user_id=current_user.id,
        activity_type="upload",
        description=f"Uploaded {file.filename}"
    )
    db.add(activity)
    
    db.commit()
    db.refresh(new_doc)
    
    # Process PDF and chunk text
    from app.services.pdf_service import process_pdf
    from app.services.embedding_service import embed_document_chunks
    from fastapi import BackgroundTasks
    
    try:
        # Currently processing synchronously for simplicity and immediate status updates, 
        # but could be moved to BackgroundTasks or Celery for larger files.
        process_pdf(db, new_doc)
        if new_doc.status == "processed":
            embed_document_chunks(new_doc.id, current_user.id, db)
    except Exception as e:
        # Errors are already logged and status updated to 'error' inside process_pdf
        pass
    
    return new_doc

@router.get("/", response_model=List[DocumentResponse])
def get_documents(db: SessionDep, current_user: CurrentUser):
    docs = db.query(Document).filter(Document.user_id == current_user.id).order_by(Document.upload_date.desc()).all()
    return docs

@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(document_id: uuid.UUID, db: SessionDep, current_user: CurrentUser):
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Delete from file system
    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)
        
    # Delete embeddings from ChromaDB
    from app.services.embedding_service import delete_document_embeddings
    try:
        delete_document_embeddings(doc.id)
    except Exception as e:
        pass # Best effort cleanup
        
    # Delete from DB
    db.delete(doc)
    db.commit()
    return None
