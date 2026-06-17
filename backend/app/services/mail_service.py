import logging
from datetime import datetime
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from app.core.config import settings

logger = logging.getLogger(__name__)

conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

fast_mail = FastMail(conf)

async def send_feedback_email(name: str, email: str, feedback_type: str, message: str, rating: int):
    if not settings.ADMIN_EMAIL:
        logger.warning("ADMIN_EMAIL not set, skipping email send")
        return
        
    subject = f"SmartStudy AI Feedback - {feedback_type}"
    body = f"""
    New feedback received for SmartStudy AI:

    From: {name} ({email})
    Type: {feedback_type}
    Rating: {rating}/5
    Submitted at: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
    
    Message:
    {message}
    """
    
    msg = MessageSchema(
        subject=subject,
        recipients=[settings.ADMIN_EMAIL],
        body=body,
        subtype=MessageType.plain
    )
    
    try:
        await fast_mail.send_message(msg)
        logger.info(f"Feedback email sent to {settings.ADMIN_EMAIL}")
    except Exception as e:
        logger.error(f"Failed to send feedback email: {e}")
        raise
