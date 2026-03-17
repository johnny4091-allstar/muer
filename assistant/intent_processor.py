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
  "response_hint": "<brief natural language acknowledgement, 1-2 sentences>"
}

Available intents and their params:

MUSIC:
- play_music: {query: string}
- stop_music: {}
- pause_music: {}
- resume_music: {}

VOLUME:
- volume_up: {amount: int (default 10)}
- volume_down: {amount: int (default 10)}
- volume_set: {level: int 0-100}
- mute: {}
- unmute: {}

TIMERS & ALARMS:
- set_timer: {duration_seconds: int, label: string}
- cancel_timer: {label: string}
- set_alarm: {time: string (e.g. "7:30 AM"), name: string, repeat: bool}
- cancel_alarm: {name: string}
- list_alarms: {}
- snooze_alarm: {minutes: int (default 9), name: string}

REMINDERS:
- set_reminder: {message: string, time: string}
- list_reminders: {}

LISTS:
- list_add: {item: string, list: string (default "shopping")}
- list_remove: {item: string, list: string}
- list_show: {list: string}
- list_clear: {list: string}

NOTES:
- take_note: {content: string}
- read_notes: {}
- clear_notes: {}

WEATHER & DATE/TIME:
- get_weather: {city: string}
- get_time: {}
- get_date: {}

NEWS & BRIEFING:
- get_news: {category: string (general|technology|sports|business|science), count: int}
- flash_briefing: {}

INFORMATION:
- wikipedia_lookup: {query: string}
- define_word: {word: string}
- calculate: {expression: string}
- convert_units: {amount: float, from_unit: string, to_unit: string}
- percentage: {percent: float, of: float}
- translate: {text: string, language: string}
- spell_word: {word: string}
- word_definition: {word: string}
- synonym: {word: string}

FUN:
- tell_joke: {type: string (default "random")}
- tell_fact: {topic: string}
- flip_coin: {}
- roll_dice: {sides: int (default 6)}
- pick_number: {min: int, max: int}

ROUTINES:
- good_morning: {}
- good_night: {}
- run_routine: {name: string}
- flash_briefing: {}

AMBIENT & RADIO:
- play_ambient: {sound: string (rain|ocean|forest|fireplace|white noise|coffee shop|thunderstorm|sleep|focus|meditation)}
- play_radio: {station: string}
- stop_ambient: {}
- list_radio: {}

STOPWATCH:
- stopwatch_start: {}
- stopwatch_stop: {}
- stopwatch_lap: {}
- stopwatch_reset: {}
- stopwatch_read: {}

SYSTEM CONTROL:
- open_app: {app: string}
- system_sleep: {}
- system_shutdown: {}
- system_restart: {}
- set_brightness: {level: int 0-100}
- desktop_notification: {title: string, message: string}
- announce: {message: string}
- get_clipboard: {}
- bluetooth_list: {}
- bluetooth_connect: {device: string}
- do_not_disturb: {enabled: bool}

SMART HOME (Home Assistant):
- light_on: {location: string, brightness: int}
- light_off: {location: string}
- light_dim: {location: string, level: int}
- set_thermostat: {temperature: float}
- lock_door: {location: string}
- get_home_status: {}

SPORTS:
- get_sports_scores: {league: string (nfl|nba|mlb|nhl|soccer), team: string}
- get_standings: {league: string}

Q&A:
- general_question: {question: string}
- unknown: {}

Rules:
- Pick the most specific intent that matches
- If no clear intent matches, use general_question
- response_hint should be short, conversational, suitable for speech
- Return ONLY the JSON object, no markdown, no extra text
"""


def _call_claude(user_text: str, history: list[dict]) -> dict[str, Any]:
    import anthropic  # noqa: PLC0415

    client = anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)

    messages = list(history) + [{"role": "user", "content": user_text}]

    message = client.messages.create(
        model=config.CLAUDE_MODEL,
        max_tokens=300,
        system=SYSTEM_PROMPT,
        messages=messages,
    )
    raw = message.content[0].text.strip()
    log.debug(f"Claude raw response: {raw}")

    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if match:
        return json.loads(match.group())
    return {"intent": "unknown", "params": {}, "response_hint": ""}


def parse_intent(text: str, history: list[dict] | None = None) -> dict[str, Any]:
    """Parse user text into a structured intent dict using Claude."""
    if not text.strip():
        return {"intent": "unknown", "params": {}, "response_hint": ""}

    if not config.ANTHROPIC_API_KEY:
        log.warning("ANTHROPIC_API_KEY not set — using simple keyword fallback.")
        return _keyword_fallback(text)

    try:
        result = _call_claude(text, history or [])
        log.info(f"Intent: {result.get('intent')} params={result.get('params')}")
        return result
    except Exception as e:
        log.error(f"Claude intent parsing failed: {e}")
        return _keyword_fallback(text)


def _keyword_fallback(text: str) -> dict[str, Any]:
    """Simple keyword-based intent detection (no API key required)."""
    t = text.lower().strip()

    # Music
    if any(w in t for w in ["play ", "listen to", "put on"]):
        q = re.sub(r"(play|listen to|put on)\s*", "", t, flags=re.IGNORECASE).strip()
        return {"intent": "play_music", "params": {"query": q}, "response_hint": f"Playing {q}"}
    if any(w in t for w in ["stop music", "stop the music", "pause music"]):
        return {"intent": "stop_music", "params": {}, "response_hint": "Stopping music"}
    if "resume" in t or "unpause" in t:
        return {"intent": "resume_music", "params": {}, "response_hint": "Resuming"}

    # Volume
    if "louder" in t or "volume up" in t or "turn it up" in t:
        return {"intent": "volume_up", "params": {"amount": 10}, "response_hint": "Turning up the volume"}
    if "quieter" in t or "volume down" in t or "turn it down" in t:
        return {"intent": "volume_down", "params": {"amount": 10}, "response_hint": "Turning down the volume"}
    if "mute" in t:
        return {"intent": "mute", "params": {}, "response_hint": "Muted"}

    # Timer
    if "timer" in t:
        m = re.search(r"(\d+)\s*(minute|second|hour)", t)
        if m:
            amount = int(m.group(1))
            unit = m.group(2)
            secs = amount * (60 if "minute" in unit else 3600 if "hour" in unit else 1)
            return {"intent": "set_timer", "params": {"duration_seconds": secs, "label": "timer"}, "response_hint": f"Setting a {amount} {unit} timer"}

    # Alarm
    if "alarm" in t:
        m = re.search(r"(\d{1,2}:\d{2}\s*(?:am|pm)?)", t, re.IGNORECASE)
        if m:
            return {"intent": "set_alarm", "params": {"time": m.group(1), "name": "alarm"}, "response_hint": f"Setting alarm for {m.group(1)}"}
        return {"intent": "list_alarms", "params": {}, "response_hint": ""}

    # Reminders
    if "remind" in t:
        return {"intent": "set_reminder", "params": {"message": t, "time": "in 1 hour"}, "response_hint": "Setting reminder"}

    # Lists
    if "add" in t and "list" in t:
        m = re.search(r"add (.+?) to", t)
        item = m.group(1) if m else ""
        return {"intent": "list_add", "params": {"item": item, "list": "shopping"}, "response_hint": f"Adding {item}"}
    if "shopping list" in t or "to do list" in t or "todo list" in t:
        return {"intent": "list_show", "params": {"list": "shopping"}, "response_hint": ""}

    # Notes
    if "note" in t or "remember" in t:
        content = re.sub(r"(take a note|note that|remember)", "", t, flags=re.IGNORECASE).strip()
        return {"intent": "take_note", "params": {"content": content}, "response_hint": "Note saved"}

    # News
    if "news" in t or "headline" in t or "briefing" in t:
        if "briefing" in t or "morning" in t:
            return {"intent": "flash_briefing", "params": {}, "response_hint": "Here's your briefing"}
        return {"intent": "get_news", "params": {"category": "general", "count": 5}, "response_hint": "Here are the latest headlines"}

    # Weather
    if "weather" in t:
        return {"intent": "get_weather", "params": {"city": config.DEFAULT_WEATHER_CITY}, "response_hint": ""}

    # Time / date
    if "time" in t:
        return {"intent": "get_time", "params": {}, "response_hint": ""}
    if "date" in t or "today" in t:
        return {"intent": "get_date", "params": {}, "response_hint": ""}

    # Math
    if any(w in t for w in ["calculate", "what is", "how much is", "convert", "percent"]):
        return {"intent": "calculate", "params": {"expression": t}, "response_hint": ""}

    # Jokes
    if "joke" in t:
        return {"intent": "tell_joke", "params": {}, "response_hint": ""}
    if "fact" in t:
        return {"intent": "tell_fact", "params": {}, "response_hint": ""}

    # Ambient
    if "rain sounds" in t or "white noise" in t or "ambient" in t:
        sound = "rain" if "rain" in t else "white noise" if "noise" in t else "ocean"
        return {"intent": "play_ambient", "params": {"sound": sound}, "response_hint": f"Playing {sound} sounds"}
    if "radio" in t:
        return {"intent": "play_radio", "params": {"station": "NPR"}, "response_hint": "Playing radio"}

    # Good morning / night
    if "good morning" in t:
        return {"intent": "good_morning", "params": {}, "response_hint": "Good morning!"}
    if "good night" in t:
        return {"intent": "good_night", "params": {}, "response_hint": "Good night!"}

    # System
    if "sleep" in t and ("computer" in t or "system" in t or "put" in t):
        return {"intent": "system_sleep", "params": {}, "response_hint": "Going to sleep"}
    if "shutdown" in t or "shut down" in t:
        return {"intent": "system_shutdown", "params": {}, "response_hint": "Shutting down"}
    if "open " in t:
        app = t.replace("open ", "").strip()
        return {"intent": "open_app", "params": {"app": app}, "response_hint": f"Opening {app}"}

    # Sports
    if "score" in t or "game" in t:
        return {"intent": "get_sports_scores", "params": {"league": "nba"}, "response_hint": ""}

    # Wikipedia
    if t.startswith("who is") or t.startswith("what is") or t.startswith("tell me about"):
        query = re.sub(r"^(who is|what is|tell me about)\s*", "", t).strip()
        return {"intent": "wikipedia_lookup", "params": {"query": query}, "response_hint": ""}

    # Flip/roll
    if "flip" in t and "coin" in t:
        return {"intent": "flip_coin", "params": {}, "response_hint": ""}
    if "roll" in t and "dice" in t:
        return {"intent": "roll_dice", "params": {"sides": 6}, "response_hint": ""}

    # Default: general question
    return {"intent": "general_question", "params": {"question": text}, "response_hint": ""}
