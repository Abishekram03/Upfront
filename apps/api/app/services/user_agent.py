from user_agents import parse

def parse_user_agent(ua_string: str, screen_width: int = None):
    """
    Parses user-agent string into device class, browser, and OS.
    Uses screen_width heuristics if available.
    """
    if not ua_string:
        return {
            "device": "Desktop",
            "browser": "Unknown",
            "os": "Unknown"
        }

    try:
        user_agent = parse(ua_string)
        
        # Device determination
        if screen_width:
            if screen_width < 768:
                device = "Mobile"
            elif screen_width < 1024:
                device = "Tablet"
            elif screen_width < 1440:
                device = "Laptop"
            else:
                device = "Desktop"
        else:
            if user_agent.is_mobile:
                device = "Mobile"
            elif user_agent.is_tablet:
                device = "Tablet"
            elif user_agent.is_pc:
                device = "Desktop"
            else:
                device = "Desktop"

        # Browser determination
        browser = user_agent.browser.family or "Other"
        if "Chrome" in browser and "Edge" in ua_string:
            browser = "Edge"
        elif "Chrome" in browser and "Brave" in ua_string:
            browser = "Brave"

        # OS determination
        os_name = user_agent.os.family or "Other"
        if "Mac" in os_name or "OS X" in os_name:
            os_name = "macOS"

        return {
            "device": device,
            "browser": browser,
            "os": os_name,
        }
    except Exception:
        return {
            "device": "Desktop",
            "browser": "Chrome",
            "os": "Windows"
        }
