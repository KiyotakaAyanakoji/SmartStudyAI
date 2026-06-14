import logging
import uuid
import chromadb
from sqlalchemy.orm import Session
from sentence_transformers import SentenceTransformer
from app.core.config import settings
from app.models.chunk import Chunk

logger = logging.getLogger(__name__)

# Initialize ChromaDB Client
chroma_client = chromadb.PersistentClient(path=settings.CHROMA_DB_PATH)
COLLECTION_NAME = "smartstudy_chunks"

# Load SentenceTransformer model
MODEL_NAME = "all-MiniLM-L6-v2"
logger.info(f"Loading SentenceTransformer model: {MODEL_NAME}")
model = SentenceTransformer(MODEL_NAME)
logger.info(f"Model {MODEL_NAME} loaded successfully")

def generate_embedding(text: str) -> list[float]:
    """Generates an embedding vector for the given text."""
    embedding = model.encode(text)
    return embedding.tolist()

def embed_document_chunks(document_id: uuid.UUID, user_id: uuid.UUID, db: Session):
    """
    Fetches chunks for the document from PostgreSQL, generates embeddings,
    and stores them in ChromaDB.
    """
    logger.info(f"Starting embedding process for document: {document_id}")
    
    try:
        # 1. Fetch chunks from Postgres
        chunks = db.query(Chunk).filter(Chunk.document_id == document_id, Chunk.user_id == user_id).order_by(Chunk.chunk_index).all()
        if not chunks:
            logger.warning(f"No chunks found for document {document_id}")
            return
            
        logger.info(f"Found {len(chunks)} chunks for document {document_id}")
        
        # 2. Generate embeddings
        texts = [chunk.chunk_text for chunk in chunks]
        embeddings = model.encode(texts).tolist()
        
        # 3. Prepare ChromaDB input
        ids = [str(chunk.id) for chunk in chunks]
        documents = texts
        metadatas = [
            {
                "chunk_id": str(chunk.id),
                "document_id": str(chunk.document_id),
                "user_id": str(chunk.user_id),
                "page_number": int(chunk.page_number)
            }
            for chunk in chunks
        ]
        
        # 4. Store in ChromaDB
        collection = chroma_client.get_or_create_collection(name=COLLECTION_NAME)
        collection.add(
            ids=ids,
            embeddings=embeddings,
            metadatas=metadatas,
            documents=documents
        )
        
        logger.info(f"Successfully added {len(chunks)} embeddings to ChromaDB for document {document_id}")
        
    except Exception as e:
        logger.error(f"Failed to embed chunks for document {document_id}: {str(e)}")
        raise e

def delete_document_embeddings(document_id: uuid.UUID):
    """
    Deletes all embeddings for a specific document from ChromaDB.
    """
    logger.info(f"Deleting embeddings for document: {document_id} from ChromaDB")
    try:
        collection = chroma_client.get_collection(name=COLLECTION_NAME)
        # Delete by metadata filter
        collection.delete(where={"document_id": str(document_id)})
        logger.info(f"Successfully deleted embeddings for document: {document_id}")
    except chromadb.errors.InvalidCollectionException:
        logger.warning(f"Collection {COLLECTION_NAME} not found when trying to delete embeddings.")
    except Exception as e:
        logger.error(f"Failed to delete embeddings for document {document_id}: {str(e)}")
        # We don't raise here to allow DB deletion to proceed even if ChromaDB fails,
        # but in production we might want a background job to clean up orphaned embeddings.
