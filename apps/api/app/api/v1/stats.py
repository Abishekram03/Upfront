from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.stats import StatsResponse
from app.services.aggregator import get_site_stats

router = APIRouter()

@router.get("/stats", response_model=StatsResponse)
async def get_stats(
    domain: str = Query(..., description="Tracked domain name"),
    period: str = Query(default="30d", description="Time period: 24h, 7d, 30d, 12m"),
    source: Optional[str] = Query(default=None, description="Filter by referrer source (e.g. Google, Direct, Twitter)"),
    page: Optional[str] = Query(default=None, description="Filter by pathname (e.g. /pricing, /blog)"),
    country: Optional[str] = Query(default=None, description="Filter by country name or 2-letter code (e.g. United States, US)"),
    browser: Optional[str] = Query(default=None, description="Filter by browser (e.g. Chrome, Safari, Firefox)"),
    device: Optional[str] = Query(default=None, description="Filter by device type (e.g. Desktop, Mobile, Tablet)"),
    os: Optional[str] = Query(default=None, description="Filter by operating system (e.g. Windows, macOS, iOS, Android)"),
    db: AsyncSession = Depends(get_db),
):
    try:
        clean_domain = domain.replace("https://", "").replace("http://", "").split("/")[0].strip().lower()
        stats = await get_site_stats(
            db,
            domain=clean_domain,
            period=period,
            source=source,
            page=page,
            country=country,
            browser=browser,
            device=device,
            os_name=os,
        )
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch site analytics: {str(e)}")

