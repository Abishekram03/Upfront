import re

BOT_REGEX = re.compile(
    r"(bot|crawl|spider|slurp|googlebot|bingbot|yandex|baidu|duckduckbot|facebookexternalhit|"
    r"twitterbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|"
    r"slackbot|vkShare|W3C_Validator|ahrefs|semrush|dotbot|mj12bot|bytespider|gptbot|"
    r"headlesschrome|phantomjs|puppeteer|lighthouse|pingdom|uptimerobot)",
    re.IGNORECASE
)

def is_bot(user_agent: str) -> bool:
    if not user_agent:
        return True
    return bool(BOT_REGEX.search(user_agent))
