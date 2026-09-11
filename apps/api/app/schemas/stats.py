from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class MetricSummary(BaseModel):
    visitors: int
    previous_visitors: int
    visitors_change_pct: float

    pageviews: int
    previous_pageviews: int
    pageviews_change_pct: float

    bounce_rate: float
    previous_bounce_rate: float
    bounce_rate_change_pct: float

    visit_duration: int # in seconds
    previous_visit_duration: int
    duration_change_pct: float

class TimeSeriesPoint(BaseModel):
    date: str
    label: str
    visitors: int
    pageviews: int
    bounce_rate: float
    duration: int

class BreakdownItem(BaseModel):
    id: str
    label: str
    value: int
    percentage: float
    icon: Optional[str] = None
    sublabel: Optional[str] = None
    link: Optional[str] = None

class DeviceBreakdown(BaseModel):
    screen_sizes: List[BreakdownItem]
    browsers: List[BreakdownItem]
    os: List[BreakdownItem]

class StatsResponse(BaseModel):
    domain: str
    period: str
    realtime_visitors: int
    metrics: MetricSummary
    time_series: List[TimeSeriesPoint]
    top_sources: List[BreakdownItem]
    top_pages: List[BreakdownItem]
    locations: List[BreakdownItem]
    devices: DeviceBreakdown
