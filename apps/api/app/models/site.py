import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base

class Site(Base):
    __tablename__ = "sites"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    domain = Column(String(255), unique=True, index=True, nullable=False)
    timezone = Column(String(64), default="UTC", nullable=False)
    public = Column(Boolean, default=False, nullable=False)
    user_id = Column(String(64), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    consent_config = relationship("ConsentConfig", back_populates="site", uselist=False, cascade="all, delete-orphan")
    consent_receipts = relationship("ConsentReceipt", back_populates="site", cascade="all, delete-orphan")
