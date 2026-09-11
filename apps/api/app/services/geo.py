from fastapi import Request

# Flag emoji helper
def country_code_to_flag(country_code: str) -> str:
    if not country_code or len(country_code) != 2:
        return "🌐"
    return "".join(chr(127397 + ord(char.upper())) for char in country_code)

def resolve_geo(request: Request) -> dict:
    """
    Extracts country and city from standard CDN headers (Cloudflare, Vercel, AWS CloudFront)
    or falls back to default.
    """
    headers = request.headers

    country = (
        headers.get("cf-ipcountry")
        or headers.get("x-vercel-ip-country")
        or headers.get("cloudfront-viewer-country")
        or headers.get("x-country-code")
        or "US"
    ).upper()

    city = (
        headers.get("cf-ipcity")
        or headers.get("x-vercel-ip-city")
        or headers.get("cloudfront-viewer-city")
        or "Unknown"
    )

    return {
        "country": country,
        "city": city,
        "flag": country_code_to_flag(country),
    }
