from urllib.parse import urlparse

KNOWN_SOURCES = {
    "google": ("Google", "🔍"),
    "duckduckgo": ("DuckDuckGo", "🦆"),
    "bing": ("Bing", "🌐"),
    "yahoo": ("Yahoo", "🟣"),
    "baidu": ("Baidu", "🐼"),
    "yandex": ("Yandex", "🔴"),
    "twitter": ("Twitter / X", "🐦"),
    "t.co": ("Twitter / X", "🐦"),
    "x.com": ("Twitter / X", "🐦"),
    "facebook": ("Facebook", "📘"),
    "instagram": ("Instagram", "📸"),
    "l.instagram.com": ("Instagram", "📸"),
    "youtube": ("YouTube", "▶️"),
    "linkedin": ("LinkedIn", "💼"),
    "reddit": ("Reddit", "👾"),
    "github": ("GitHub", "🐙"),
    "news.ycombinator.com": ("Hacker News", "🟧"),
    "producthunt": ("Product Hunt", "🐱"),
    "medium": ("Medium", "✍️"),
    "threads.net": ("Threads", "🧵"),
    "tiktok": ("TikTok", "🎵"),
}

def clean_referrer(referrer_url: str, current_domain: str = None) -> tuple[str, str]:
    """
    Normalizes a referrer URL into a canonical source name and icon.
    Returns (Source Name, Icon/Emoji).
    """
    if not referrer_url:
        return "Direct / None", "🔗"

    try:
        parsed = urlparse(referrer_url)
        hostname = (parsed.hostname or "").lower()

        # Internal referral from own domain
        if current_domain and current_domain in hostname:
            return "Direct / None", "🔗"

        # Check known search engines & platforms
        for key, (name, icon) in KNOWN_SOURCES.items():
            if key in hostname:
                return name, icon

        # If it's another domain, strip www
        clean_host = hostname.replace("www.", "")
        if clean_host:
            return clean_host, "🌐"
        
        return "Direct / None", "🔗"
    except Exception:
        return "Direct / None", "🔗"
