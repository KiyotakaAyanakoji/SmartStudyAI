import logging
import uuid
from sqlalchemy.orm import Session
from app.models.chunk import Chunk
from app.models.document import Document
from app.services.embedding_service import chroma_client, COLLECTION_NAME, generate_embedding
import chromadb

logger = logging.getLogger(__name__)

def search_similar_chunks(query: str, user_id: uuid.UUID, db: Session, top_k: int = 5):
    """
    Searches for similar chunks in ChromaDB using the generated embedding of the query.
    Ensures data isolation by filtering by user_id.
    """
    logger.info(f"Executing search query for user {user_id}")
    
    try:
        # 1. Generate query embedding
        query_embedding = generate_embedding(query)
        
        # 2. Search ChromaDB
        try:
            collection = chroma_client.get_collection(name=COLLECTION_NAME)
        except chromadb.errors.InvalidCollectionException:
            logger.warning(f"ChromaDB collection {COLLECTION_NAME} does not exist yet. Returning empty results.")
            return []
            
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where={"user_id": str(user_id)} # Enforce data isolation
        )
        
        if not results['ids'] or not results['ids'][0]:
            return []
            
        # Extract chunk IDs from the results
        chunk_ids = [uuid.UUID(chunk_id_str) for chunk_id_str in results['ids'][0]]
        
        if not chunk_ids:
            return []
            
        # 3. Fetch full data from PostgreSQL
        # We need the chunk text and the original document's filename
        db_chunks = (
            db.query(Chunk, Document.filename)
            .join(Document, Chunk.document_id == Document.id)
            .filter(Chunk.id.in_(chunk_ids))
            .all()
        )
        
        # Order the results to match the order of IDs returned by ChromaDB (which are sorted by similarity)
        chunk_map = {chunk.id: (chunk, filename) for chunk, filename in db_chunks}
        
        ordered_results = []
        for chunk_id in chunk_ids:
            if chunk_id in chunk_map:
                chunk, filename = chunk_map[chunk_id]
                ordered_results.append({
                    "chunk_id": str(chunk.id),
                    "chunk_text": chunk.chunk_text,
                    "filename": filename,
                    "page_number": chunk.page_number
                })
                
        return ordered_results
        
    except Exception as e:
        logger.error(f"Search failed for user {user_id}: {str(e)}")
        raise e
