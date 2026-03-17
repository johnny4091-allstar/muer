"""
Intent processor: sends transcribed text to Claude API and returns
a structured intent dict.
"""

import json
import re
from typing import Any

from assistant.config import config
from assistant.utils.logger import get_logger

log = get_logger("intent")

SYSTEM_PROMPT = """You are a voice assistant intent parser. The user speaks a command and you must parse it into a JSON object.

Return ONLY valid JSON with this structure:
{
  "intent": "<intent_name>",
  "params": {<key>: <value>, ...},
  "response_hint": "<brief natural language response to say back>"
}

Available intents:
- play_music: params: {query: string}
- stop_music: params: {}
- pause_music: params: {}
- resume_music: params: {}
- volume_up: params: {amount: int (0-100, default 10)}
- volume_down: params: {amount: int (0-100, default 10)}
- volume_set: params: {level: int (0-100)}
- mute: params: {}
- unmute: params: {}
- set_timer: params: {duration_seconds: int, label: string}
- cancel_timer: params: {label: string or "all"}
- get_weather: params: {city: string}
- get_time: params: {}
- get_date: params: {}
- general_question: params: {question: string}
- unknown: params: {}

If the intent is unclear use "unknown".
Respond ONLY with the JSON object, no markdown, no extra text."""


def _call_claude(user_text: str) -> dict[str, Any]:
    import anthropic  # noqa: PLC0415

    client = anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)
    message = client.messages.create(
        model=config.CLAUDE_MODEL,
        max_tokens=256,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_text}],
    )
    raw = message.content[0].text.strip()
    log.debug(f"Claude raw response: {raw}")

    # Extract JSON even if model adds surrounding text
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if match:
        return json.loads(match.group())
    return {"intent": "unknown", "params": {}, "response_hint": ""}


def parse_intent(text: str) -> dict[str, Any]:
    """Parse user text into a structured intent dict using Claude."""
    if not text.strip():
        return {"intent": "unknown", "params": {}, "response_hint": ""}

    if not config.ANTHROPIC_API_KEY:
        log.warning("ANTHROPIC_API_KEY not set — using simple keyword fallback.")
        return _keyword_fallback(text)

    try:
        result = _call_claude(text)
        log.info(f"Intent: {result.get('intent')} params={result.get('params')}")
        return result
    except Exception as e:
        log.error(f"Claude intent parsing failed: {e}")
        return _keyword_fallback(text)


def _keyword_fallback(text: str) -> dict[str, Any]:
    """Simple keyword-based intent detection (no API key required)."""
    t = text.lower()
    if any(w in t for w in ["play ", "listen to", "put on"]):
        query = re.sub(r"(play|listen to|put on)\s*", "", t, flags=re.IGNORECASE).strip()
        return {"intent": "play_music", "params": {"query": query}, "response_hint": f"Playing {query}"}
    if any(w in t for w in ["stop", "pause"]):
        return {"intent": "stop_music", "params": {}, "response_hint": "Stopping music"}
    if "louder" in t or "volume up" in t:
        return {"intent": "volume_up", "params": {"amount": 10}, "response_hint": "Turning up the volume"}
    if "quieter" in t or "volume down" in t:
        return {"intent": "volume_down", "params": {"amount": 10}, "response_hint": "Turning down the volume"}
    if "weather" in t:
        return {"intent": "get_weather", "params": {"city": config.DEFAULT_WEATHER_CITY}, "response_hint": ""}
    if "time" in t:
        return {"intent": "get_time", "params": {}, "response_hint": ""}
    if "date" in t or "today" in t:
        return {"intent": "get_date", "params": {}, "response_hint": ""}
    if "timer" in t:
        # Extract number of minutes/seconds
        m = re.search(r"(\d+)\s*(minute|second|hour)", t)
        if m:
            amount = int(m.group(1))
            unit = m.group(2)
            secs = amount * (60 if "minute" in unit else 3600 if "hour" in unit else 1)
            return {"intent": "set_timer", "params": {"duration_seconds": secs, "label": "timer"}, "response_hint": f"Setting a {amount} {unit} timer"}
    return {"intent": "general_question", "params": {"question": text}, "response_hint": ""}
