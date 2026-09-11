from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

class IngestEventPayload(BaseModel):
    domain: str = Field(..., description="The registered website domain (e.g. example.com)")
    name: str = Field(default="pageview", description="Event name (e.g. pageview or custom goal)")
    url: str = Field(..., description="Full URL of the page visited")
    referrer: Optional[str] = Field(default=None, description="Document referrer URL")
    screen_width: Optional[int] = Field(default=None, description="Browser window screen width in pixels")
    props: Optional[Dict[str, Any]] = Field(default=None, description="Custom event metadata properties")

class IngestResponse(BaseModel):
    ok: bool = True
