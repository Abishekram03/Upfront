import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Integer, JSON
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
    
    preferences_title = Column(String(255), default="Customise Consent Preferences")
    preferences_description = Column(Text, default="We respect your privacy preferences. You can customize which category of cookies or tracking scripts you permit on this website. Essential cookies cannot be turned off.")
    save_preferences_label = Column(String(100), default="Save My Preferences")
    always_active_label = Column(String(100), default="Always Active")
    no_cookies_to_display_label = Column(String(100), default="No cookies to display")
    cookie_column_label = Column(String(100), default="Cookie")
    duration_column_label = Column(String(100), default="Duration")
    description_column_label = Column(String(100), default="Description")
    
    # Categories (5 Standard Categories)
    enable_necessary_category = Column(Boolean, default=True)
    enable_functional_category = Column(Boolean, default=True)
    enable_analytics_category = Column(Boolean, default=True)
    enable_performance_category = Column(Boolean, default=True)
    enable_advertisement_category = Column(Boolean, default=True)
    
    # Floating Revisit Cookie Button
    show_revisit_button = Column(Boolean, default=True)
    revisit_button_position = Column(String(50), default="bottom_left")
    
    # Google Consent Mode v2 & GPC
    enable_consent_mode_v2 = Column(Boolean, default=True)
    enable_gpc = Column(Boolean, default=True)
    consent_version = Column(String(20), default="1.0")
    
    # Geo Targeting: all, eu_uk_only, eu_uk_us_only
    geo_targeting = Column(String(50), default="all")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    site = relationship("Site", back_populates="consent_config", lazy="selectin")


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
    consent_version = Column(String(20), default="1.0")
    receipt_hash = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    site = relationship("Site", back_populates="consent_receipts", lazy="selectin")


class DiscoveredCookie(Base):
    __tablename__ = "discovered_cookies"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    site_id = Column(String(36), ForeignKey("sites.id", ondelete="CASCADE"), nullable=True, index=True)
    domain = Column(String(255), nullable=False, index=True)
    
    name = Column(String(255), nullable=False)
    category = Column(String(50), nullable=False, default="functional")
    service_name = Column(String(100), nullable=True)
    duration = Column(String(50), nullable=True, default="Session")
    description = Column(Text, nullable=True)
    confidence = Column(String(20), default="high")
    status = Column(String(50), default="detected")
    script_pattern_regex = Column(Text, nullable=True)
    
    first_detected_at = Column(DateTime, default=datetime.utcnow)
    last_detected_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ScanRun(Base):
    __tablename__ = "scans"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    site_id = Column(String(36), ForeignKey("sites.id", ondelete="CASCADE"), nullable=True, index=True)
    domain = Column(String(255), nullable=False, index=True)
    
    status = Column(String(50), default="completed")
    cookies_found = Column(Integer, default=0)
    scripts_found = Column(Integer, default=0)
    leaks_found = Column(Integer, default=0)
    dark_patterns_found = Column(Integer, default=0)
    findings = Column(JSON, default=list)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
