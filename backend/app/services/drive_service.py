import os
import io
import logging
from uuid import UUID
from datetime import datetime, timezone
from fastapi import HTTPException
from sqlalchemy.orm import Session
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload, MediaIoBaseUpload

from app.core.config import settings
from app.models.drive_token import DriveToken
from app.models.audio_file import AudioFile

logger = logging.getLogger(__name__)

# Required Google Drive scope for file management
SCOPES = ['https://www.googleapis.com/auth/drive.file']

def get_flow():
    """Builds the OAuth2 flow object."""
    client_config = {
        "web": {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "project_id": "smartstudy-ai",
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uris": [settings.GOOGLE_REDIRECT_URI]
        }
    }
    
    flow = Flow.from_client_config(
        client_config,
        scopes=SCOPES,
        redirect_uri=settings.GOOGLE_REDIRECT_URI
    )
    return flow

def get_auth_url(user_id: UUID) -> str:
    flow = get_flow()
    auth_url, _ = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent'
    )
    
    code_verifier = getattr(flow, 'code_verifier', '')
    state_str = f"{user_id}::{code_verifier}"
    
    from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
    parsed = urlparse(auth_url)
    query = parse_qs(parsed.query)
    query['state'] = [state_str]
    new_query = urlencode(query, doseq=True)
    auth_url = urlunparse(parsed._replace(query=new_query))
    
    return auth_url

def exchange_code_for_tokens(code: str, user_id: UUID, code_verifier: str, db: Session):
    logger.info(f"Starting exchange_code_for_tokens for user {user_id}")
    try:
        flow = get_flow()
        logger.info("Fetching token from Google...")
        
        kwargs = {"code": code}
        if code_verifier:
            kwargs["code_verifier"] = code_verifier
            
        flow.fetch_token(**kwargs)
        credentials = flow.credentials
        logger.info("Successfully fetched token from Google.")
    except Exception as e:
        logger.error(f"Failed to fetch token from Google: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail="Failed to fetch token from Google")

    try:
        logger.info("Saving tokens to database...")
        # Upsert DriveToken
        token_record = db.query(DriveToken).filter(DriveToken.user_id == user_id).first()
        if not token_record:
            token_record = DriveToken(user_id=user_id)
            db.add(token_record)
            
        token_record.access_token = credentials.token
        token_record.refresh_token = credentials.refresh_token or token_record.refresh_token
        token_record.token_expiry = credentials.expiry.replace(tzinfo=timezone.utc) if credentials.expiry else None
        
        db.commit()
        logger.info("Successfully saved tokens to database.")
        return True
    except Exception as e:
        logger.error(f"Failed to save tokens to database: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to save tokens to database")

def get_drive_service(user_id: UUID, db: Session):
    token_record = db.query(DriveToken).filter(DriveToken.user_id == user_id).first()
    if not token_record or not token_record.access_token:
        raise HTTPException(status_code=401, detail="Google Drive not connected")
        
    creds = Credentials(
        token=token_record.access_token,
        refresh_token=token_record.refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
        scopes=SCOPES
    )
    
    if creds.expired and creds.refresh_token:
        try:
            from google.auth.transport.requests import Request
            creds.refresh(Request())
            # Update DB with refreshed token
            token_record.access_token = creds.token
            token_record.token_expiry = creds.expiry.replace(tzinfo=timezone.utc) if creds.expiry else None
            db.commit()
        except Exception as e:
            logger.error(f"Failed to refresh Drive token: {e}")
            raise HTTPException(status_code=401, detail="Google Drive token expired. Please reconnect.")
            
    try:
        service = build('drive', 'v3', credentials=creds)
        return service
    except Exception as e:
        logger.error(f"Failed to build drive service: {e}")
        raise HTTPException(status_code=500, detail="Failed to connect to Google Drive")

def get_or_create_folder(service, folder_name="SmartStudy AI") -> str:
    try:
        # Check if folder exists
        query = f"name='{folder_name}' and mimeType='application/vnd.google-apps.folder' and trashed=false"
        results = service.files().list(q=query, spaces='drive', fields='files(id, name)').execute()
        items = results.get('files', [])
        
        if not items:
            # Create folder
            file_metadata = {
                'name': folder_name,
                'mimeType': 'application/vnd.google-apps.folder'
            }
            folder = service.files().create(body=file_metadata, fields='id').execute()
            return folder.get('id')
        else:
            return items[0].get('id')
    except Exception as e:
        logger.error(f"Failed to get/create folder: {e}")
        raise HTTPException(status_code=500, detail="Failed to initialize Drive folder")

def upload_text_to_drive(user_id: UUID, db: Session, filename: str, content: str) -> str:
    service = get_drive_service(user_id, db)
    folder_id = get_or_create_folder(service)
    
    file_metadata = {
        'name': filename,
        'parents': [folder_id]
    }
    
    # Use io.BytesIO for text upload
    fh = io.BytesIO(content.encode('utf-8'))
    media = MediaIoBaseUpload(fh, mimetype='text/plain', resumable=True)
    
    try:
        file = service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id, webViewLink'
        ).execute()
        return file.get('webViewLink')
    except Exception as e:
        logger.error(f"Failed to upload text file to drive: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload file to Google Drive")

def upload_audio_to_drive(user_id: UUID, db: Session, audio_id: UUID) -> str:
    audio_file = db.query(AudioFile).filter(AudioFile.id == audio_id, AudioFile.user_id == user_id).first()
    if not audio_file:
        raise HTTPException(status_code=404, detail="Audio file not found")
        
    if not os.path.exists(audio_file.file_path):
        raise HTTPException(status_code=404, detail="Audio file physical content not found")

    service = get_drive_service(user_id, db)
    folder_id = get_or_create_folder(service)
    
    file_metadata = {
        'name': audio_file.filename,
        'parents': [folder_id]
    }
    
    media = MediaFileUpload(audio_file.file_path, mimetype='audio/mpeg', resumable=True)
    
    try:
        file = service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id, webViewLink'
        ).execute()
        return file.get('webViewLink')
    except Exception as e:
        logger.error(f"Failed to upload audio to drive: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload audio to Google Drive")
