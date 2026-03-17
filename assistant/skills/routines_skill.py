"""
Routines skill: multi-step "good morning", "good night", and custom routines.
"""

import json
from pathlib import Path
from typing import Any

from assistant.config import config
from assistant.skills import register
from assistant.utils.logger import get_logger

log = get_logger("skill.routines")

_DATA_FILE = Path(config.DATA_DIR) / "routines.json"
_custom_routines: dict[str, list[str]] = {}


def _load() -> None:
    if _DATA_FILE.exists():
        try:
            _custom_routines.update(json.loads(_DATA_FILE.read_text()))
        except Exception:
            pass


def _save() -> None:
    _DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    _DATA_FILE.write_text(json.dumps(_custom_routines, indent=2))


@register("good_morning")
def good_morning(params: dict[str, Any], tts, response_hint: str = "") -> None:
    """Full morning briefing routine."""
    from datetime import datetime  # noqa: PLC0415
    from assistant.skills.datetime_skill import get_date, get_time  # noqa: PLC0415
    from assistant.skills.weather_skill import get_weather  # noqa: PLC0415
    from assistant.skills.news_skill import get_news  # noqa: PLC0415

    hour = datetime.now().hour
    greeting = "Good morning" if hour < 12 else "Good afternoon" if hour < 17 else "Good evening"
    tts.speak(f"{greeting}! Here's your daily briefing.")

    get_date({}, tts)
    get_time({}, tts)
    get_weather({"city": config.DEFAULT_WEATHER_CITY}, tts)
    get_news({"category": "general", "count": 3}, tts)

    # Show reminders for today
    from assistant.skills import reminder_skill  # noqa: PLC0415
    from assistant.skills import alarm_skill  # noqa: PLC0415
    if alarm_skill._alarms:
        count = len(alarm_skill._alarms)
        tts.speak(f"You have {count} alarm{'s' if count > 1 else ''} set today.")

    tts.speak("Have a wonderful day!")


@register("good_night")
def good_night(params: dict[str, Any], tts, response_hint: str = "") -> None:
    """Evening wind-down routine."""
    from assistant.skills.music import stop_music  # noqa: PLC0415

    tts.speak("Good night! Wrapping up for the evening.")
    # Stop any playing music
    stop_music({}, tts, "")
    tts.speak("Sleep well!")


@register("run_routine")
def run_routine(params: dict[str, Any], tts, response_hint: str = "") -> None:
    name = params.get("name", "").strip().lower()
    if name in ("good morning", "morning"):
        good_morning(params, tts)
    elif name in ("good night", "night", "bedtime"):
        good_night(params, tts)
    else:
        steps = _custom_routines.get(name)
        if steps:
            tts.speak(f"Running routine: {name}.")
            for step in steps:
                tts.speak(step)
        else:
            tts.speak(f"I don't have a routine called {name}.")


@register("create_routine")
def create_routine(params: dict[str, Any], tts, response_hint: str = "") -> None:
    name = params.get("name", "").strip().lower()
    steps = params.get("steps", [])
    if not name or not steps:
        tts.speak("Please provide a name and steps for the routine.")
        return
    _custom_routines[name] = steps
    _save()
    tts.speak(f"Routine '{name}' saved with {len(steps)} steps.")


_load()
