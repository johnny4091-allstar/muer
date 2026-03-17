"""
Skill registry: maps intent names to handler functions.
Each handler receives (params: dict, tts: TextToSpeech) and returns None.
"""

from typing import Any, Callable

from assistant.utils.logger import get_logger

log = get_logger("skills")

_REGISTRY: dict[str, Callable] = {}


def register(intent: str):
    """Decorator to register a skill handler for an intent."""
    def decorator(fn: Callable):
        _REGISTRY[intent] = fn
        return fn
    return decorator


def dispatch(intent_data: dict[str, Any], tts) -> bool:
    """Dispatch to the appropriate skill. Returns True if handled."""
    intent = intent_data.get("intent", "unknown")
    params = intent_data.get("params", {})
    response_hint = intent_data.get("response_hint", "")

    handler = _REGISTRY.get(intent)
    if handler is None:
        log.warning(f"No skill registered for intent: {intent}")
        tts.speak("I'm not sure how to help with that.")
        return False

    try:
        handler(params=params, tts=tts, response_hint=response_hint)
        return True
    except Exception as e:
        log.error(f"Skill '{intent}' raised an error: {e}", exc_info=True)
        tts.speak("Sorry, something went wrong with that.")
        return False


# Import all skill modules to trigger @register() decorators
from assistant.skills import (  # noqa: E402, F401
    music,
    system_control,
    timer_skill,
    weather_skill,
    general_qa,
    datetime_skill,
    # New skills
    alarm_skill,
    reminder_skill,
    lists_skill,
    notes_skill,
    news_skill,
    wikipedia_skill,
    math_skill,
    jokes_skill,
    routines_skill,
    ambient_skill,
    stopwatch_skill,
    system_skill,
    smart_home_skill,
    sports_skill,
    translation_skill,
)
