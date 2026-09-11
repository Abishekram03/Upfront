import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Integer
from sqlalchemy.orm import relationship
from app.core.database import Base

class ConsentConfig(Base):
    __tablename__ = "consent_configs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    site_id = Column(String(36), ForeignKey("sites.id", ondelete="CASCADE"), nullable=True, index=True)
    domain = Column(String(255), nullable=False, unique=True, index=True)
    
    is_enabled = Column(Boolean, default=True)
    
    # Layout: bottom_bar, floating_bottom_left, floating_bottom_right, center_modal
    layout = Column(String(50), default="bottom_bar")
    
    # Styling: light, dark, brand
    theme = Column(String(50), default="light")
    primary_color = Column(String(50), default="#1868db")
    border_radius = Column(String(20), default="rounded-md")
    
    # Content & Copy
    title = Column(String(255), default="We value your privacy")
    description = Column(Text, default="We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking 'Accept All', you consent to our use of cookies.")
    privacy_policy_url = Column(String(500), default="/privacy")
    
    accept_all_label = Column(String(100), default="Accept All")
    reject_all_label = Column(String(100), default="Reject All")
    preferences_label = Column(String(100), default="Customise")
    
    # Categories (5 Standard CookieYes Categories)
    enable_necessary_category = Column(Boolean, default=True) # Always active
    enable_functional_category = Column(Boolean, default=True)
    enable_analytics_category = Column(Boolean, default=True)
    enable_performance_category = Column(Boolean, default=True)
    enable_advertisement_category = Column(Boolean, default=True)
    
    # Floating Revisit Cookie Button
    show_revisit_button = Column(Boolean, default=True)
    revisit_button_position = Column(String(50), default="bottom_left") # bottom_left or bottom_right
    
    # Google Consent Mode v2
    enable_consent_mode_v2 = Column(Boolean, default=True)
    
    # Geo Targeting: all, eu_uk_only, eu_uk_us_only
    geo_targeting = Column(String(50), default="all")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    site = relationship("Site", back_populates="consent_config", lazy="joined")


class ConsentReceipt(Base):
    __tablename__ = "consent_receipts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    site_id = Column(String(36), ForeignKey("sites.id", ondelete="CASCADE"), nullable=True, index=True)
    domain = Column(String(255), nullable=False, index=True)
    
    visitor_hash = Column(String(64), nullable=False, index=True)
    country = Column(String(10), nullable=True)
    
    consent_given = Column(Boolean, default=True)
    necessary = Column(Boolean, default=True)
    functional = Column(Boolean, default=False)
    analytics = Column(Boolean, default=False)
    performance = Column(Boolean, default=False)
    advertisement = Column(Boolean, default=False)
    
    user_agent_category = Column(String(50), default="Desktop")
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    site = relationship("Site", back_populates="consent_receipts", lazy="joined")
