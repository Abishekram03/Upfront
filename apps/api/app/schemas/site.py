from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class SiteCreate(BaseModel):
    domain: str = Field(..., description="Root domain (e.g. yourwebsite.com)")
    timezone: Optional[str] = Field(default="UTC", description="Reporting timezone")

class SiteOut(BaseModel):
    id: str
    domain: str
    timezone: str
    public: bool
    created_at: datetime

    class Config:
        from_attributes = True
