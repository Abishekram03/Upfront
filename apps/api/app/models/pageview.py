import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Index
from app.core.database import Base

class Pageview(Base):
    __tablename__ = "pageviews"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    site_id = Column(String(36), ForeignKey("sites.id", ondelete="CASCADE"), nullable=False, index=True)
    session_id = Column(String(36), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    
    pathname = Column(String(500), nullable=False, index=True)
    search_query = Column(String(500), nullable=True)
    
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    __table_args__ = (
        Index("ix_pageview_site_timestamp", "site_id", "timestamp"),
        Index("ix_pageview_site_path_timestamp", "site_id", "pathname", "timestamp"),
    )
