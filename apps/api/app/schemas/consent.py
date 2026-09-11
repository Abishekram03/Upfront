from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field

class ConsentConfigBase(BaseModel):
    is_enabled: bool = True
    layout: str = Field(default="bottom_bar", description="bottom_bar, floating_bottom_left, floating_bottom_right, center_modal")
    theme: str = Field(default="light", description="light, dark, brand")
    primary_color: str = Field(default="#1868db")
    border_radius: str = Field(default="rounded-md")
    
    title: str = Field(default="We value your privacy")
    description: str = Field(default="We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking 'Accept All', you consent to our use of cookies.")
    privacy_policy_url: str = Field(default="/privacy")
    
    accept_all_label: str = Field(default="Accept All")
    reject_all_label: str = Field(default="Reject All")
    preferences_label: str = Field(default="Customise")
    
    # 5 CookieYes Standard Categories
    enable_necessary_category: bool = True
    enable_functional_category: bool = True
    enable_analytics_category: bool = True
    enable_performance_category: bool = True
    enable_advertisement_category: bool = True
    
    # Floating Revisit Cookie Button
    show_revisit_button: bool = True
    revisit_button_position: str = Field(default="bottom_left", description="bottom_left, bottom_right")
    
    enable_consent_mode_v2: bool = True
    geo_targeting: str = Field(default="all", description="all, eu_uk_only, eu_uk_us_only")

class ConsentConfigIn(ConsentConfigBase):
    domain: str

class ConsentConfigOut(ConsentConfigBase):
    id: str
    domain: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ConsentReceiptCreate(BaseModel):
    domain: str
    visitor_hash: Optional[str] = None
    consent_given: bool = True
    necessary: bool = True
    functional: bool = False
    analytics: bool = False
    performance: bool = False
    advertisement: bool = False
    marketing: Optional[bool] = False # alias for backward compatibility
    country: Optional[str] = None
    user_agent_category: Optional[str] = "Desktop"

class ConsentReceiptOut(BaseModel):
    id: str
    domain: str
    visitor_hash: str
    country: Optional[str]
    consent_given: bool
    necessary: bool
    functional: bool
    analytics: bool
    performance: bool
    advertisement: bool
    user_agent_category: str
    created_at: datetime

    class Config:
        from_attributes = True

class ConsentStatsSummary(BaseModel):
    domain: str
    total_receipts: int
    acceptance_rate: float
    rejection_rate: float
    necessary_accepted_pct: float
    functional_accepted_pct: float
    analytics_accepted_pct: float
    performance_accepted_pct: float
    advertisement_accepted_pct: float
    recent_receipts: List[ConsentReceiptOut]
