"""
Wikipedia skill: look up facts and definitions.
"""

from typing import Any

import requests

from assistant.skills import register
from assistant.utils.logger import get_logger

log = get_logger("skill.wikipedia")

WIKI_API = "https://en.wikipedia.org/api/rest_v1/page/summary/"


def _lookup(query: str) -> str:
    try:
        # Try direct page lookup first
        url = WIKI_API + requests.utils.quote(query.replace(" ", "_"))
        r = requests.get(url, timeout=5, headers={"User-Agent": "MuerAssistant/1.0"})
        if r.status_code == 200:
            data = r.json()
            extract = data.get("extract", "")
            if extract:
                # Return first 2-3 sentences (suitable for speech)
                sentences = extract.split(". ")
                return ". ".join(sentences[:3]).strip() + "."
        # Fallback: search
        search_url = "https://en.wikipedia.org/w/api.php"
        params = {"action": "query", "list": "search", "srsearch": query, "format": "json", "srlimit": 1}
        r2 = requests.get(search_url, params=params, timeout=5)
        results = r2.json().get("query", {}).get("search", [])
        if results:
            title = results[0]["title"]
            return _lookup(title)
        return f"I couldn't find information about {query}."
    except Exception as e:
        log.error(f"Wikipedia lookup failed: {e}")
        return "Sorry, I couldn't reach Wikipedia right now."


@register("wikipedia_lookup")
def wikipedia_lookup(params: dict[str, Any], tts, response_hint: str = "") -> None:
    query = params.get("query", "").strip()
    if not query:
        tts.speak("What would you like to know about?")
        return
    result = _lookup(query)
    tts.speak(result)


@register("define_word")
def define_word(params: dict[str, Any], tts, response_hint: str = "") -> None:
    word = params.get("word", "").strip()
    if not word:
        tts.speak("What word would you like defined?")
        return
    result = _lookup(word)
    tts.speak(result)
