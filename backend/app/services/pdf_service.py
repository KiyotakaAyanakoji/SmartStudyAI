import logging
import fitz  # PyMuPDF
from sqlalchemy.orm import Session
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.models.chunk import Chunk
from app.models.document import Document

logger = logging.getLogger(__name__)

def process_pdf(db: Session, document: Document):
    """
    Extracts text from a PDF, chunks it using LangChain, 
    and saves the chunks to the database.
    """
    logger.info(f"Starting PDF processing for document: {document.id}")
    
    try:
        # 1. Extract text from PDF
        doc = fitz.open(document.file_path)
        
        extracted_pages = []
        total_text_length = 0
        
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            text = page.get_text()
            extracted_pages.append({
                "page_number": page_num + 1,
                "text": text
            })
            total_text_length += len(text.strip())
            
        doc.close()
        
        # Check if PDF is likely scanned (very little text)
        if total_text_length < 50:
            raise ValueError("PDF contains no extractable text. It might be a scanned image.")
            
        logger.info(f"Successfully extracted {total_text_length} characters from {len(extracted_pages)} pages.")
        
        # 2. Split into chunks using LangChain
        text_splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
            chunk_size=500,
            chunk_overlap=50
        )
        
        chunks_to_insert = []
        chunk_index = 0
        
        for page_data in extracted_pages:
            if not page_data["text"].strip():
                continue
                
            page_chunks = text_splitter.split_text(page_data["text"])
            
            for chunk_text in page_chunks:
                if not chunk_text.strip():
                    continue
                    
                chunks_to_insert.append(
                    Chunk(
                        document_id=document.id,
                        user_id=document.user_id,
                        chunk_text=chunk_text,
                        chunk_index=chunk_index,
                        page_number=page_data["page_number"]
                    )
                )
                chunk_index += 1
                
        logger.info(f"Created {len(chunks_to_insert)} chunks for document {document.id}.")
        
        # 3. Save chunks to PostgreSQL
        if chunks_to_insert:
            db.bulk_save_objects(chunks_to_insert)
            
        # 4. Update document status
        document.status = "processed"
        db.commit()
        logger.info(f"Successfully processed document: {document.id}")
        
    except Exception as e:
        logger.error(f"Failed to process document {document.id}: {str(e)}")
        document.status = "error"
        db.commit()
        raise e
