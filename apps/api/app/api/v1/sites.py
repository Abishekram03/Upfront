from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.site import Site
from app.models.session import Session
from app.models.pageview import Pageview
from app.models.consent import ConsentConfig, ConsentReceipt
from app.schemas.site import SiteCreate, SiteOut

class SiteUpdate(BaseModel):
    timezone: Optional[str] = None
    public: Optional[bool] = None

router = APIRouter()

@router.get("/sites", response_model=List[SiteOut])
async def list_sites(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Site).order_by(Site.created_at.desc()))
    return result.scalars().all()

@router.post("/sites", response_model=SiteOut)
async def create_site(payload: SiteCreate, db: AsyncSession = Depends(get_db)):
    clean_domain = payload.domain.replace("https://", "").replace("http://", "").split("/")[0].strip().lower()
    
    existing = await db.execute(select(Site).where(Site.domain == clean_domain))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Domain already exists")

    site = Site(
        domain=clean_domain,
        timezone=payload.timezone or "UTC",
    )
    db.add(site)
    await db.commit()
    await db.refresh(site)
    return site

@router.patch("/sites/{site_id}", response_model=SiteOut)
async def update_site(site_id: str, payload: SiteUpdate, db: AsyncSession = Depends(get_db)):
    site = await db.get(Site, site_id)
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    if payload.timezone is not None:
        site.timezone = payload.timezone
    if payload.public is not None:
        site.public = payload.public
    await db.commit()
    await db.refresh(site)
    return site

@router.delete("/sites/{site_id}")
async def delete_site(site_id: str, db: AsyncSession = Depends(get_db)):
    site = await db.get(Site, site_id)
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    
    try:
        # Cascade delete dependent records
        await db.execute(delete(Pageview).where(Pageview.site_id == site.id))
        await db.execute(delete(Session).where(Session.site_id == site.id))
        await db.execute(delete(ConsentReceipt).where(ConsentReceipt.domain == site.domain))
        await db.execute(delete(ConsentConfig).where(ConsentConfig.domain == site.domain))
        await db.delete(site)
        await db.commit()
        return {"ok": True, "message": "Site and all associated data deleted successfully"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete site: {str(e)}")
