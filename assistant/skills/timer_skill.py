"""
Timer skill: set and cancel named timers.
When a timer fires, the assistant speaks an alert.
"""

import threading
from typing import Any

from assistant.skills import register
from assistant.utils.logger import get_logger

log = get_logger("skill.timer")

_timers: dict[str, threading.Timer] = {}


def _format_duration(seconds: int) -> str:
    if seconds < 60:
        return f"{seconds} second{'s' if seconds != 1 else ''}"
    minutes = seconds // 60
    rem = seconds % 60
    label = f"{minutes} minute{'s' if minutes != 1 else ''}"
    if rem:
        label += f" and {rem} second{'s' if rem != 1 else ''}"
    return label


def _fire_timer(label: str, tts) -> None:
    _timers.pop(label, None)
    log.info(f"Timer '{label}' fired!")
    tts.speak(f"Timer done! Your {label} is complete.")


@register("set_timer")
def set_timer(params: dict[str, Any], tts, response_hint: str = "") -> None:
    duration = int(params.get("duration_seconds", 60))
    label = str(params.get("label", "timer")).strip()

    # Cancel existing timer with same label
    if label in _timers:
        _timers[label].cancel()

    timer = threading.Timer(duration, _fire_timer, args=(label, tts))
    timer.daemon = True
    timer.start()
    _timers[label] = timer

    duration_str = _format_duration(duration)
    tts.speak(response_hint or f"Setting a {duration_str} timer.")
    log.info(f"Timer '{label}' set for {duration} seconds.")


@register("cancel_timer")
def cancel_timer(params: dict[str, Any], tts, response_hint: str = "") -> None:
    label = str(params.get("label", "all")).strip()

    if label == "all":
        for t in _timers.values():
            t.cancel()
        _timers.clear()
        tts.speak("All timers cancelled.")
        return

    timer = _timers.pop(label, None)
    if timer:
        timer.cancel()
        tts.speak(f"Timer {label} cancelled.")
    else:
        tts.speak(f"I couldn't find a timer called {label}.")
