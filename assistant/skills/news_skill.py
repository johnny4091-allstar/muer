"""
News skill: fetch top headlines via NewsAPI or RSS fallback.
"""

from typing import Any

import requests

from assistant.config import config
from assistant.skills import register
from assistant.utils.logger import get_logger

log = get_logger("skill.news")

NEWSAPI_URL = "https://newsapi.org/v2/top-headlines"
RSS_FEEDS = {
    "general": "https://feeds.bbci.co.uk/news/rss.xml",
    "technology": "https://feeds.bbci.co.uk/news/technology/rss.xml",
    "sports": "https://feeds.bbci.co.uk/sport/rss.xml",
    "business": "https://feeds.bbci.co.uk/news/business/rss.xml",
    "science": "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml",
}


def _fetch_newsapi(category: str, count: int) -> list[str]:
    params: dict = {"language": "en", "pageSize": count}
    if config.NEWS_API_KEY:
        params["apiKey"] = config.NEWS_API_KEY
    if category and category != "general":
        params["category"] = category
    else:
        params["country"] = "us"
    try:
        r = requests.get(NEWSAPI_URL, params=params, timeout=5)
        data = r.json()
        return [a["title"] for a in data.get("articles", [])[:count]]
    except Exception as e:
        log.error(f"NewsAPI failed: {e}")
        return []


def _fetch_rss(category: str, count: int) -> list[str]:
    url = RSS_FEEDS.get(category, RSS_FEEDS["general"])
    try:
        import xml.etree.ElementTree as ET  # noqa: PLC0415, N817
        r = requests.get(url, timeout=5, headers={"User-Agent": "MuerAssistant/1.0"})
        root = ET.fromstring(r.content)
        titles = []
        for item in root.iter("item"):
            title = item.find("title")
            if title is not None and title.text:
                titles.append(title.text.strip())
            if len(titles) >= count:
                break
        return titles
    except Exception as e:
        log.error(f"RSS fetch failed: {e}")
        return []


@register("get_news")
def get_news(params: dict[str, Any], tts, response_hint: str = "") -> None:
    category = params.get("category", "general").lower().strip()
    count = min(int(params.get("count", 5)), 10)

    headlines = _fetch_newsapi(category, count) if config.NEWS_API_KEY else []
    if not headlines:
        headlines = _fetch_rss(category, count)

    if not headlines:
        tts.speak("Sorry, I couldn't fetch the news right now.")
        return

    tts.speak(f"Here are {len(headlines)} top {category} headlines.")
    for i, h in enumerate(headlines, 1):
        # Sanitize: remove pipes, dashes that indicate source
        clean = h.split(" - ")[0].split(" | ")[0].strip()
        tts.speak(f"Headline {i}: {clean}")


@register("flash_briefing")
def flash_briefing(params: dict[str, Any], tts, response_hint: str = "") -> None:
    """Morning-style briefing: time + weather + top 3 news."""
    from datetime import datetime  # noqa: PLC0415
    from assistant.skills.datetime_skill import get_time, get_date  # noqa: PLC0415
    from assistant.skills.weather_skill import get_weather  # noqa: PLC0415

    tts.speak("Here's your flash briefing.")
    get_date({}, tts)
    get_time({}, tts)
    get_weather({"city": config.DEFAULT_WEATHER_CITY}, tts)
    get_news({"category": "general", "count": 3}, tts)
    tts.speak("That's your briefing. Have a great day!")
