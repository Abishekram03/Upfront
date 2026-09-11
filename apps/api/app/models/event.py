import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Index, Text
from app.core.database import Base

class CustomEvent(Base):
    __tablename__ = "events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    site_id = Column(String(36), ForeignKey("sites.id", ondelete="CASCADE"), nullable=False, index=True)
    session_id = Column(String(36), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=True, index=True)
    
    event_name = Column(String(100), nullable=False, index=True)
    pathname = Column(String(500), nullable=True)
    properties_json = Column(Text, nullable=True)
    
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    __table_args__ = (
        Index("ix_event_site_name_timestamp", "site_id", "event_name", "timestamp"),
    )
