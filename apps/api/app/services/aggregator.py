from datetime import datetime, timedelta
from typing import Dict, Any, List
from sqlalchemy import select, func, and_, desc, distinct
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.site import Site
from app.models.session import Session
from app.models.pageview import Pageview
from app.services.geo import country_code_to_flag

COUNTRY_NAMES = {
    "US": "United States",
    "GB": "United Kingdom",
    "IN": "India",
    "CA": "Canada",
    "DE": "Germany",
    "AU": "Australia",
    "JP": "Japan",
    "BR": "Brazil",
    "FR": "France",
    "NL": "Netherlands",
    "ID": "Indonesia",
    "PH": "Philippines",
    "RU": "Russian Federation",
    "IT": "Italy",
    "MX": "Mexico",
    "ES": "Spain",
    "PL": "Poland",
    "SG": "Singapore",
    "TR": "Turkey",
    "SE": "Sweden",
}

async def get_site_stats(
    db: AsyncSession,
    domain: str,
    period: str = "30d",
) -> Dict[str, Any]:
    # 1. Look up site
    site_query = select(Site).where(Site.domain == domain)
    result = await db.execute(site_query)
    site = result.scalar_one_or_none()
    
    now = datetime.utcnow()
    
    # Determine date window
    if period == "24h":
        days = 1
        delta = timedelta(hours=24)
    elif period == "7d":
        days = 7
        delta = timedelta(days=7)
    elif period == "12m":
        days = 365
        delta = timedelta(days=365)
    else: # 30d
        days = 30
        delta = timedelta(days=30)
        
    start_date = now - delta
    prev_start_date = start_date - delta
    prev_end_date = start_date

    site_id = site.id if site else "demo_fallback"

    # 2. Realtime Active Visitors (Last 5 minutes)
    five_min_ago = now - timedelta(minutes=5)
    rt_query = select(func.count(distinct(Session.visitor_hash))).where(
        and_(
            Session.site_id == site_id,
            Session.last_activity_at >= five_min_ago
        )
    )
    rt_res = await db.execute(rt_query)
    realtime_count = rt_res.scalar() or 0

    # 3. Current Period Metrics
    curr_metrics_q = select(
        func.count(distinct(Session.visitor_hash)).label("unique_visitors"),
        func.sum(Session.pageviews_count).label("total_pageviews"),
        func.avg(Session.duration).label("avg_duration"),
        func.sum(func.cast(Session.is_bounce, func.INTEGER if "sqlite" in str(db.bind.url) else func.INT)).label("bounces"),
        func.count(Session.id).label("total_sessions"),
    ).where(
        and_(
            Session.site_id == site_id,
            Session.started_at >= start_date,
            Session.started_at <= now
        )
    )
    curr_res = (await db.execute(curr_metrics_q)).one()

    visitors = curr_res.unique_visitors or 0
    pageviews = curr_res.total_pageviews or 0
    avg_dur = int(curr_res.avg_duration or 0)
    total_sess = curr_res.total_sessions or 0
    bounces = curr_res.bounces or 0
    bounce_rate = round((bounces / total_sess * 100), 1) if total_sess > 0 else 0.0

    # 4. Previous Period Metrics
    prev_metrics_q = select(
        func.count(distinct(Session.visitor_hash)).label("prev_visitors"),
        func.sum(Session.pageviews_count).label("prev_pageviews"),
        func.avg(Session.duration).label("prev_duration"),
        func.sum(func.cast(Session.is_bounce, func.INTEGER if "sqlite" in str(db.bind.url) else func.INT)).label("prev_bounces"),
        func.count(Session.id).label("prev_sessions"),
    ).where(
        and_(
            Session.site_id == site_id,
            Session.started_at >= prev_start_date,
            Session.started_at < prev_end_date
        )
    )
    prev_res = (await db.execute(prev_metrics_q)).one()

    prev_visitors = prev_res.prev_visitors or 0
    prev_pageviews = prev_res.prev_pageviews or 0
    prev_avg_dur = int(prev_res.prev_duration or 0)
    prev_sess = prev_res.prev_sessions or 0
    prev_bounces = prev_res.prev_bounces or 0
    prev_bounce_rate = round((prev_bounces / prev_sess * 100), 1) if prev_sess > 0 else 0.0

    def calc_pct(curr, prev):
        if prev == 0:
            return 0.0
        return round(((curr - prev) / prev) * 100, 1)

    metrics_summary = {
        "visitors": visitors,
        "previous_visitors": prev_visitors,
        "visitors_change_pct": calc_pct(visitors, prev_visitors),
        
        "pageviews": pageviews,
        "previous_pageviews": prev_pageviews,
        "pageviews_change_pct": calc_pct(pageviews, prev_pageviews),
        
        "bounce_rate": bounce_rate,
        "previous_bounce_rate": prev_bounce_rate,
        "bounce_rate_change_pct": calc_pct(bounce_rate, prev_bounce_rate),
        
        "visit_duration": avg_dur,
        "previous_visit_duration": prev_avg_dur,
        "duration_change_pct": calc_pct(avg_dur, prev_avg_dur),
    }

    # 5. Time Series (Daily Buckets)
    time_series = []
    # Build daily slots
    step = 1 if days <= 30 else (days // 30)
    for i in range(days, -1, -step):
        d = now - timedelta(days=i)
        day_str = d.strftime("%Y-%m-%d")
        day_start = datetime(d.year, d.month, d.day, 0, 0, 0)
        day_end = datetime(d.year, d.month, d.day, 23, 59, 59)

        ts_q = select(
            func.count(distinct(Session.visitor_hash)).label("v"),
            func.sum(Session.pageviews_count).label("p"),
            func.avg(Session.duration).label("dur"),
            func.sum(func.cast(Session.is_bounce, func.INTEGER if "sqlite" in str(db.bind.url) else func.INT)).label("b"),
            func.count(Session.id).label("tot"),
        ).where(
            and_(
                Session.site_id == site_id,
                Session.started_at >= day_start,
                Session.started_at <= day_end
            )
        )
        ts_res = (await db.execute(ts_q)).one()

        v_day = ts_res.v or 0
        p_day = ts_res.p or 0
        dur_day = int(ts_res.dur or 0)
        tot_day = ts_res.tot or 0
        b_day = ts_res.b or 0
        br_day = round((b_day / tot_day * 100), 1) if tot_day > 0 else 0.0

        time_series.append({
            "date": day_str,
            "label": d.strftime("%a, %d %b"),
            "visitors": v_day,
            "pageviews": p_day,
            "bounce_rate": br_day,
            "duration": dur_day,
        })

    # 6. Top Sources
    sources_q = select(
        Session.referrer_source.label("name"),
        func.count(distinct(Session.visitor_hash)).label("cnt")
    ).where(
        and_(
            Session.site_id == site_id,
            Session.started_at >= start_date,
            Session.referrer_source != None
        )
    ).group_by(Session.referrer_source).order_by(desc("cnt")).limit(20)
    
    sources_res = (await db.execute(sources_q)).all()
    top_sources = [
        {
            "id": f"s_{idx}",
            "label": row.name,
            "value": row.cnt,
            "percentage": round((row.cnt / max(1, visitors)) * 100),
            "icon": "🌐",
        }
        for idx, row in enumerate(sources_res)
    ]

    # 7. Top Pages
    pages_q = select(
        Pageview.pathname.label("path"),
        func.count(Pageview.id).label("cnt")
    ).where(
        and_(
            Pageview.site_id == site_id,
            Pageview.timestamp >= start_date
        )
    ).group_by(Pageview.pathname).order_by(desc("cnt")).limit(20)

    pages_res = (await db.execute(pages_q)).all()
    top_pages = [
        {
            "id": f"p_{idx}",
            "label": row.path,
            "value": row.cnt,
            "percentage": round((row.cnt / max(1, pageviews)) * 100),
            "link": f"https://{domain}{row.path}"
        }
        for idx, row in enumerate(pages_res)
    ]

    # 8. Locations (Countries)
    geo_q = select(
        Session.country.label("code"),
        func.count(distinct(Session.visitor_hash)).label("cnt")
    ).where(
        and_(
            Session.site_id == site_id,
            Session.started_at >= start_date,
            Session.country != None
        )
    ).group_by(Session.country).order_by(desc("cnt")).limit(30)

    geo_res = (await db.execute(geo_q)).all()
    locations = [
        {
            "id": f"c_{idx}",
            "label": COUNTRY_NAMES.get(row.code, row.code),
            "value": row.cnt,
            "percentage": round((row.cnt / max(1, visitors)) * 100),
            "icon": country_code_to_flag(row.code),
        }
        for idx, row in enumerate(geo_res)
    ]

    # 9. Devices, Browsers, OS
    async def get_breakdown(column):
        q = select(
            column.label("name"),
            func.count(distinct(Session.visitor_hash)).label("cnt")
        ).where(
            and_(
                Session.site_id == site_id,
                Session.started_at >= start_date,
                column != None
            )
        ).group_by(column).order_by(desc("cnt")).limit(10)
        res = (await db.execute(q)).all()
        return [
            {
                "id": f"dev_{idx}",
                "label": row.name,
                "value": row.cnt,
                "percentage": round((row.cnt / max(1, visitors)) * 100),
            }
            for idx, row in enumerate(res)
        ]

    devices_list = await get_breakdown(Session.device)
    browsers_list = await get_breakdown(Session.browser)
    os_list = await get_breakdown(Session.os)

    return {
        "domain": domain,
        "period": period,
        "realtime_visitors": realtime_count,
        "metrics": metrics_summary,
        "time_series": time_series,
        "top_sources": top_sources,
        "top_pages": top_pages,
        "locations": locations,
        "devices": {
            "screen_sizes": devices_list,
            "browsers": browsers_list,
            "os": os_list,
        }
    }
