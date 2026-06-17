import sys
import time
from app.core.database import SessionLocal
from app.models.document import Document
from app.models.user import User
from app.services import study_service

db = SessionLocal()
user = db.query(User).first()
if not user:
    print("No users")
    sys.exit()

docs = db.query(Document).filter(Document.user_id == user.id).all()
if len(docs) < 2:
    print("Not enough docs")
    sys.exit()

doc_ids = [docs[0].id, docs[1].id]
print(f"Testing summary with docs: {doc_ids}")

try:
    print("Getting document content...", flush=True)
    content = study_service._get_document_content(None, doc_ids, user.id, db)
    print(f"Content length: {len(content)}", flush=True)
    
    prompt = f"Summarize this:\n{content[:100]}..."
    print("Calling generate_content...", flush=True)
    start = time.time()
    response = study_service.model.generate_content(prompt)
    print("Time:", time.time() - start, flush=True)
    print("Summary:", response.text[:100], flush=True)
except Exception as e:
    print("Error:", e, flush=True)
