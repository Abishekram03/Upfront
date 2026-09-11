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
    db: AsyncSession = Depends(get_db),
):
    try:
        clean_domain = domain.replace("https://", "").replace("http://", "").split("/")[0].strip().lower()
        stats = await get_site_stats(db, domain=clean_domain, period=period)
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch site analytics: {str(e)}")
