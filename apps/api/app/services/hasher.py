import hashlib
from datetime import datetime, timezone
from app.core.config import settings

def hash_visitor(domain: str, ip: str, user_agent: str, date_str: str = None) -> str:
    """
    Generates a privacy-friendly, irreversible daily visitor hash.
    SHA256(site_domain + secret_salt + date + ip + user_agent)
    Because the date changes daily, visitor tracking automatically resets every 24h,
    and raw IP addresses are never saved into any database.
    """
    if not date_str:
        date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    raw = f"{domain}:{settings.HASH_SALT}:{date_str}:{ip}:{user_agent}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()
