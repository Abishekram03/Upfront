import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Index
from app.core.database import Base

class Session(Base):
    __tablename__ = "sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    site_id = Column(String(36), ForeignKey("sites.id", ondelete="CASCADE"), nullable=False, index=True)
    hostname = Column(String(255), nullable=False, index=True)
    visitor_hash = Column(String(64), nullable=False, index=True)
    
    entry_page = Column(String(500), nullable=True)
    exit_page = Column(String(500), nullable=True)
    
    referrer = Column(String(500), nullable=True)
    referrer_source = Column(String(100), nullable=True, index=True)
    
    country = Column(String(8), nullable=True, index=True)
    city = Column(String(100), nullable=True)
    
    device = Column(String(50), nullable=True, index=True)  # Desktop, Mobile, Tablet, Laptop
    browser = Column(String(50), nullable=True, index=True) # Chrome, Safari, Firefox, Edge
    os = Column(String(50), nullable=True, index=True)      # macOS, Windows, iOS, Android, Linux
    
    duration = Column(Integer, default=0, nullable=False)   # in seconds
    pageviews_count = Column(Integer, default=1, nullable=False)
    is_bounce = Column(Boolean, default=True, nullable=False)
    
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    last_activity_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("ix_session_site_started", "site_id", "started_at"),
        Index("ix_session_site_hash_started", "site_id", "visitor_hash", "started_at"),
    )
