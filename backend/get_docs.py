import sys
from app.core.database import SessionLocal
from app.models.document import Document
from app.models.user import User

db = SessionLocal()
user = db.query(User).first()
if not user:
    print("No users")
    sys.exit()

docs = db.query(Document).filter(Document.user_id == user.id).all()
if not docs:
    print("No docs")
    sys.exit()

print(f"User: {user.email}")
print(f"Docs: {[d.id for d in docs]}")
