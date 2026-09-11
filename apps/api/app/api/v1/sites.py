from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.site import Site
from app.schemas.site import SiteCreate, SiteOut

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

@router.delete("/sites/{site_id}")
async def delete_site(site_id: str, db: AsyncSession = Depends(get_db)):
    site = await db.get(Site, site_id)
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    await db.delete(site)
    await db.commit()
    return {"ok": True, "message": "Site deleted successfully"}
