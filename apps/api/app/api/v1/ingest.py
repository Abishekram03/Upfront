import json
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse
from fastapi import APIRouter, Depends, Request, Response, BackgroundTasks
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db, AsyncSessionLocal
from app.models.site import Site
from app.models.session import Session
from app.models.pageview import Pageview
from app.models.event import CustomEvent
from app.schemas.ingest import IngestEventPayload, IngestResponse
from app.services.hasher import hash_visitor
from app.services.bot_filter import is_bot
from app.services.user_agent import parse_user_agent
from app.services.geo import resolve_geo
from app.services.referrer import clean_referrer

router = APIRouter()

async def process_beacon_event(
    payload_dict: dict,
    client_ip: str,
    user_agent: str,
    geo_data: dict,
):
    """
    Background worker to process the incoming event without blocking client response.
    """
    if is_bot(user_agent):
        return

    domain = payload_dict.get("domain", "").lower().strip()
    if not domain:
        return

    # Clean domain
    domain = domain.replace("https://", "").replace("http://", "").split("/")[0]

    async with AsyncSessionLocal() as db:
        # 1. Look up site, or auto-create if not registered yet
        site_q = select(Site).where(Site.domain == domain)
        site = (await db.execute(site_q)).scalar_one_or_none()
        if not site:
            site = Site(domain=domain, timezone="UTC")
            db.add(site)
            await db.commit()
            await db.refresh(site)

        now = datetime.now(timezone.utc)
        today_str = now.strftime("%Y-%m-%d")

        # 2. Daily visitor hash
        v_hash = hash_visitor(domain, client_ip, user_agent, today_str)

        # 3. Parse path from URL
        url = payload_dict.get("url", "/")
        try:
            parsed_url = urlparse(url)
            pathname = parsed_url.path or "/"
            query = parsed_url.query or None
        except Exception:
            pathname = "/"
            query = None

        # 4. Check for active session in the last 30 minutes
        thirty_min_ago = now - timedelta(minutes=30)
        session_q = select(Session).where(
            and_(
                Session.site_id == site.id,
                Session.visitor_hash == v_hash,
                Session.last_activity_at >= thirty_min_ago
            )
        ).order_by(Session.started_at.desc()).limit(1)

        active_session = (await db.execute(session_q)).scalar_one_or_none()

        event_name = payload_dict.get("name", "pageview")

        if active_session:
            # Update existing session
            duration = int((now - active_session.started_at).total_seconds())
            active_session.duration = max(active_session.duration, duration)
            active_session.last_activity_at = now
            active_session.exit_page = pathname
            if event_name == "pageview":
                active_session.pageviews_count += 1
                active_session.is_bounce = False
            session_id = active_session.id
        else:
            # Create new session
            ua_data = parse_user_agent(user_agent, payload_dict.get("screen_width"))
            referrer_source, _ = clean_referrer(payload_dict.get("referrer"), domain)

            new_session = Session(
                site_id=site.id,
                hostname=domain,
                visitor_hash=v_hash,
                entry_page=pathname,
                exit_page=pathname,
                referrer=payload_dict.get("referrer"),
                referrer_source=referrer_source,
                country=geo_data.get("country", "US"),
                city=geo_data.get("city", "Unknown"),
                device=ua_data.get("device", "Desktop"),
                browser=ua_data.get("browser", "Chrome"),
                os=ua_data.get("os", "Windows"),
                duration=0,
                pageviews_count=1,
                is_bounce=True,
                started_at=now,
                last_activity_at=now,
            )
            db.add(new_session)
            await db.commit()
            await db.refresh(new_session)
            session_id = new_session.id

        # 5. Record Pageview or Custom Event
        if event_name == "pageview":
            pv = Pageview(
                site_id=site.id,
                session_id=session_id,
                pathname=pathname,
                search_query=query,
                timestamp=now,
            )
            db.add(pv)
        else:
            props = payload_dict.get("props")
            ev = CustomEvent(
                site_id=site.id,
                session_id=session_id,
                event_name=event_name,
                pathname=pathname,
                properties_json=json.dumps(props) if props else None,
                timestamp=now,
            )
            db.add(ev)

        await db.commit()

@router.post("/event", response_model=IngestResponse)
@router.post("/send", response_model=IngestResponse)
async def ingest_event(
    payload: IngestEventPayload,
    request: Request,
    background_tasks: BackgroundTasks,
):
    # Extract client metadata
    client_ip = (
        request.headers.get("x-forwarded-for", "").split(",")[0].strip()
        or request.headers.get("x-real-ip")
        or request.client.host
        or "127.0.0.1"
    )
    user_agent = request.headers.get("user-agent", "")
    geo_data = resolve_geo(request)

    background_tasks.add_task(
        process_beacon_event,
        payload.model_dump(),
        client_ip,
        user_agent,
        geo_data,
    )

    return IngestResponse(ok=True)
