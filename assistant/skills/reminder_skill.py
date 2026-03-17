"""
Reminder skill: set and list reminders at specific times.
Persists across restarts.
"""

import json
import threading
import time
from datetime import datetime
from pathlib import Path
from typing import Any
import re

from assistant.config import config
from assistant.skills import register
from assistant.utils.logger import get_logger

log = get_logger("skill.reminder")

_DATA_FILE = Path(config.DATA_DIR) / "reminders.json"
_reminders: dict[str, dict] = {}
_lock = threading.Lock()


def _save() -> None:
    _DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    serializable = {k: {kk: vv for kk, vv in v.items() if kk != "timer"} for k, v in _reminders.items()}
    _DATA_FILE.write_text(json.dumps(serializable, indent=2))


def _fire_reminder(key: str) -> None:
    from assistant.skills._tts_ref import speak  # noqa: PLC0415
    with _lock:
        entry = _reminders.pop(key, None)
    if entry:
        _save()
        speak(f"Reminder: {entry['message']}")
        log.info(f"Reminder fired: {entry['message']}")


def _schedule(key: str, message: str, timestamp: float) -> None:
    delay = max(0, timestamp - time.time())
    t = threading.Timer(delay, _fire_reminder, args=(key,))
    t.daemon = True
    t.start()
    _reminders[key] = {
        "message": message,
        "timestamp": timestamp,
        "time_str": datetime.fromtimestamp(timestamp).strftime("%I:%M %p"),
        "timer": t,
    }


def _parse_time(time_str: str) -> float | None:
    time_str = time_str.strip().lower()
    now = datetime.now()
    m = re.match(r"in (\d+)\s*(minute|hour|second)", time_str)
    if m:
        amount = int(m.group(1))
        unit = m.group(2)
        delta = {"minute": 60, "hour": 3600, "second": 1}[unit] * amount
        return time.time() + delta
    for fmt in ("%I:%M %p", "%I:%M%p", "%H:%M", "%I %p", "%I%p"):
        try:
            parsed = datetime.strptime(time_str, fmt).replace(
                year=now.year, month=now.month, day=now.day
            )
            ts = parsed.timestamp()
            if ts < time.time():
                ts += 86400
            return ts
        except ValueError:
            continue
    return None


def _load() -> None:
    if not _DATA_FILE.exists():
        return
    try:
        data = json.loads(_DATA_FILE.read_text())
        for key, entry in data.items():
            ts = entry.get("timestamp", 0)
            if ts > time.time():
                _schedule(key, entry["message"], ts)
    except Exception as e:
        log.error(f"Failed to load reminders: {e}")


@register("set_reminder")
def set_reminder(params: dict[str, Any], tts, response_hint: str = "") -> None:
    message = params.get("message", "").strip()
    time_str = params.get("time", "").strip()

    if not message:
        tts.speak("What should I remind you about?")
        return
    if not time_str:
        tts.speak("When should I remind you?")
        return

    ts = _parse_time(time_str)
    if ts is None:
        tts.speak(f"I didn't understand the time '{time_str}'.")
        return

    key = f"{message[:20]}_{int(ts)}"
    with _lock:
        _schedule(key, message, ts)
    _save()

    time_label = datetime.fromtimestamp(ts).strftime("%I:%M %p")
    tts.speak(response_hint or f"I'll remind you to {message} at {time_label}.")


@register("list_reminders")
def list_reminders(params: dict[str, Any], tts, response_hint: str = "") -> None:
    with _lock:
        if not _reminders:
            tts.speak("You have no upcoming reminders.")
            return
        items = [f"{v['message']} at {v['time_str']}" for v in _reminders.values()]
    tts.speak("Your reminders: " + "; ".join(items) + ".")


_load()
