from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import select, func, desc, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.site import Site
from app.models.consent import ConsentConfig, ConsentReceipt
from app.schemas.consent import (
    ConsentConfigIn,
    ConsentConfigOut,
    ConsentReceiptCreate,
    ConsentReceiptOut,
    ConsentStatsSummary,
)

router = APIRouter()

@router.get("/config", response_model=ConsentConfigOut)
async def get_consent_config(
    domain: str = Query(..., description="Target domain name"),
    db: AsyncSession = Depends(get_db),
):
    clean_domain = domain.replace("https://", "").replace("http://", "").split("/")[0].strip().lower()
    
    # 1. Lookup existing config
    q = select(ConsentConfig).where(ConsentConfig.domain == clean_domain)
    res = await db.execute(q)
    config = res.scalar_one_or_none()
    
    if not config:
        # Check if site exists
        site_q = select(Site).where(Site.domain == clean_domain)
        site_res = await db.execute(site_q)
        site = site_res.scalar_one_or_none()
        
        # Create default CookieYes-style config
        config = ConsentConfig(
            domain=clean_domain,
            site_id=site.id if site else None,
            is_enabled=True,
            layout="bottom_bar",
            theme="light",
            primary_color="#1868db",
            border_radius="rounded-md",
            title="We value your privacy",
            description="We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking 'Accept All', you consent to our use of cookies.",
            privacy_policy_url="/privacy",
            accept_all_label="Accept All",
            reject_all_label="Reject All",
            preferences_label="Customise",
            enable_necessary_category=True,
            enable_functional_category=True,
            enable_analytics_category=True,
            enable_performance_category=True,
            enable_advertisement_category=True,
            show_revisit_button=True,
            revisit_button_position="bottom_left",
            enable_consent_mode_v2=True,
            geo_targeting="all",
        )
        db.add(config)
        await db.commit()
        await db.refresh(config)
        
    return config


@router.post("/config", response_model=ConsentConfigOut)
async def save_consent_config(
    payload: ConsentConfigIn,
    db: AsyncSession = Depends(get_db),
):
    clean_domain = payload.domain.replace("https://", "").replace("http://", "").split("/")[0].strip().lower()
    
    q = select(ConsentConfig).where(ConsentConfig.domain == clean_domain)
    res = await db.execute(q)
    config = res.scalar_one_or_none()
    
    if not config:
        site_q = select(Site).where(Site.domain == clean_domain)
        site_res = await db.execute(site_q)
        site = site_res.scalar_one_or_none()
        
        config = ConsentConfig(
            domain=clean_domain,
            site_id=site.id if site else None,
        )
        db.add(config)
        
    # Update all fields from payload
    config.is_enabled = payload.is_enabled
    config.layout = payload.layout
    config.theme = payload.theme
    config.primary_color = payload.primary_color
    config.border_radius = payload.border_radius
    config.title = payload.title
    config.description = payload.description
    config.privacy_policy_url = payload.privacy_policy_url
    config.accept_all_label = payload.accept_all_label
    config.reject_all_label = payload.reject_all_label
    config.preferences_label = payload.preferences_label
    config.enable_necessary_category = payload.enable_necessary_category
    config.enable_functional_category = payload.enable_functional_category
    config.enable_analytics_category = payload.enable_analytics_category
    config.enable_performance_category = payload.enable_performance_category
    config.enable_advertisement_category = payload.enable_advertisement_category
    config.show_revisit_button = payload.show_revisit_button
    config.revisit_button_position = payload.revisit_button_position
    config.enable_consent_mode_v2 = payload.enable_consent_mode_v2
    config.geo_targeting = payload.geo_targeting
    
    await db.commit()
    await db.refresh(config)
    return config


@router.post("/log", response_model=dict)
async def log_consent_receipt(
    payload: ConsentReceiptCreate,
    db: AsyncSession = Depends(get_db),
):
    clean_domain = payload.domain.replace("https://", "").replace("http://", "").split("/")[0].strip().lower()
    
    site_q = select(Site).where(Site.domain == clean_domain)
    site_res = await db.execute(site_q)
    site = site_res.scalar_one_or_none()
    
    # Map advertisement or marketing
    ad_consent = payload.advertisement or payload.marketing or False
    
    receipt = ConsentReceipt(
        site_id=site.id if site else None,
        domain=clean_domain,
        visitor_hash=payload.visitor_hash or "anonymous",
        country=payload.country,
        consent_given=payload.consent_given,
        necessary=payload.necessary,
        functional=payload.functional,
        analytics=payload.analytics,
        performance=payload.performance,
        advertisement=ad_consent,
        user_agent_category=payload.user_agent_category or "Desktop",
    )
    db.add(receipt)
    await db.commit()
    return {"ok": True, "receipt_id": receipt.id}


@router.get("/receipts", response_model=List[ConsentReceiptOut])
async def list_consent_receipts(
    domain: str = Query(..., description="Target domain name"),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, le=100),
    search: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    clean_domain = domain.replace("https://", "").replace("http://", "").split("/")[0].strip().lower()
    
    offset = (page - 1) * limit
    q = select(ConsentReceipt).where(ConsentReceipt.domain == clean_domain)
    
    if search:
        search_pattern = f"%{search.strip()}%"
        q = q.where(
            (ConsentReceipt.visitor_hash.ilike(search_pattern)) |
            (ConsentReceipt.country.ilike(search_pattern))
        )
        
    q = q.order_by(desc(ConsentReceipt.created_at)).offset(offset).limit(limit)
    res = await db.execute(q)
    return res.scalars().all()


@router.get("/stats", response_model=ConsentStatsSummary)
async def get_consent_stats(
    domain: str = Query(..., description="Target domain name"),
    db: AsyncSession = Depends(get_db),
):
    clean_domain = domain.replace("https://", "").replace("http://", "").split("/")[0].strip().lower()
    
    # 1. Total receipts
    tot_q = select(func.count(ConsentReceipt.id)).where(ConsentReceipt.domain == clean_domain)
    tot_res = await db.execute(tot_q)
    total_receipts = tot_res.scalar() or 0
    
    if total_receipts == 0:
        return {
            "domain": clean_domain,
            "total_receipts": 0,
            "acceptance_rate": 0.0,
            "rejection_rate": 0.0,
            "necessary_accepted_pct": 100.0,
            "functional_accepted_pct": 0.0,
            "analytics_accepted_pct": 0.0,
            "performance_accepted_pct": 0.0,
            "advertisement_accepted_pct": 0.0,
            "recent_receipts": [],
        }
        
    # 2. Aggregations
    agg_q = select(
        func.sum(func.cast(ConsentReceipt.consent_given, func.INTEGER if "sqlite" in str(db.bind.url) else func.INT)).label("accepted"),
        func.sum(func.cast(ConsentReceipt.functional, func.INTEGER if "sqlite" in str(db.bind.url) else func.INT)).label("functional"),
        func.sum(func.cast(ConsentReceipt.analytics, func.INTEGER if "sqlite" in str(db.bind.url) else func.INT)).label("analytics"),
        func.sum(func.cast(ConsentReceipt.performance, func.INTEGER if "sqlite" in str(db.bind.url) else func.INT)).label("performance"),
        func.sum(func.cast(ConsentReceipt.advertisement, func.INTEGER if "sqlite" in str(db.bind.url) else func.INT)).label("advertisement"),
    ).where(ConsentReceipt.domain == clean_domain)
    
    agg_res = (await db.execute(agg_q)).one()
    
    accepted = agg_res.accepted or 0
    functional_cnt = agg_res.functional or 0
    analytics_cnt = agg_res.analytics or 0
    performance_cnt = agg_res.performance or 0
    advertisement_cnt = agg_res.advertisement or 0
    
    acceptance_rate = round((accepted / total_receipts) * 100, 1)
    rejection_rate = round(100.0 - acceptance_rate, 1)
    
    functional_pct = round((functional_cnt / total_receipts) * 100, 1)
    analytics_pct = round((analytics_cnt / total_receipts) * 100, 1)
    performance_pct = round((performance_cnt / total_receipts) * 100, 1)
    advertisement_pct = round((advertisement_cnt / total_receipts) * 100, 1)
    
    # 3. Recent 5 receipts
    recent_q = select(ConsentReceipt).where(ConsentReceipt.domain == clean_domain).order_by(desc(ConsentReceipt.created_at)).limit(5)
    recent_res = await db.execute(recent_q)
    recent_receipts = recent_res.scalars().all()
    
    return {
        "domain": clean_domain,
        "total_receipts": total_receipts,
        "acceptance_rate": acceptance_rate,
        "rejection_rate": rejection_rate,
        "necessary_accepted_pct": 100.0,
        "functional_accepted_pct": functional_pct,
        "analytics_accepted_pct": analytics_pct,
        "performance_accepted_pct": performance_pct,
        "advertisement_accepted_pct": advertisement_pct,
        "recent_receipts": recent_receipts,
    }
