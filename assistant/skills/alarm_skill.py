"""
Alarm skill: set, cancel, snooze, and list time-based alarms.
Alarms persist across restarts via JSON file.
"""

import json
import threading
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

from assistant.config import config
from assistant.skills import register
from assistant.utils.logger import get_logger

log = get_logger("skill.alarm")

_DATA_FILE = Path(config.DATA_DIR) / "alarms.json"
_alarms: dict[str, dict] = {}   # name -> {time_str, timestamp, timer, repeat}
_lock = threading.Lock()


def _save() -> None:
    _DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    serializable = {k: {kk: vv for kk, vv in v.items() if kk != "timer"} for k, v in _alarms.items()}
    _DATA_FILE.write_text(json.dumps(serializable, indent=2))


def _load() -> None:
    if not _DATA_FILE.exists():
        return
    try:
        data = json.loads(_DATA_FILE.read_text())
        for name, entry in data.items():
            ts = entry.get("timestamp", 0)
            if ts > time.time():
                _schedule_alarm(name, ts, entry.get("repeat", False))
    except Exception as e:
        log.error(f"Failed to load alarms: {e}")


def _fire_alarm(name: str, repeat: bool) -> None:
    from assistant.skills._tts_ref import speak  # noqa: PLC0415
    log.info(f"Alarm '{name}' fired!")
    speak(f"Wake up! Your {name} alarm is going off!")
    with _lock:
        if repeat:
            ts = time.time() + 86400  # repeat daily
            _schedule_alarm(name, ts, repeat=True)
        else:
            _alarms.pop(name, None)
    _save()


def _schedule_alarm(name: str, timestamp: float, repeat: bool = False) -> None:
    delay = max(0, timestamp - time.time())
    t = threading.Timer(delay, _fire_alarm, args=(name, repeat))
    t.daemon = True
    t.start()
    _alarms[name] = {
        "timestamp": timestamp,
        "time_str": datetime.fromtimestamp(timestamp).strftime("%I:%M %p"),
        "repeat": repeat,
        "timer": t,
    }


def _parse_time_str(time_str: str) -> float | None:
    """Parse time strings like '7:30 AM', '14:00', 'in 2 hours'."""
    time_str = time_str.strip().lower()
    now = datetime.now()

    # "in X minutes/hours"
    import re  # noqa: PLC0415
    m = re.match(r"in (\d+)\s*(minute|hour|second)", time_str)
    if m:
        amount = int(m.group(1))
        unit = m.group(2)
        delta = {"minute": 60, "hour": 3600, "second": 1}[unit] * amount
        return time.time() + delta

    # Standard time formats
    for fmt in ("%I:%M %p", "%I:%M%p", "%H:%M", "%I %p", "%I%p"):
        try:
            parsed = datetime.strptime(time_str, fmt).replace(
                year=now.year, month=now.month, day=now.day
            )
            ts = parsed.timestamp()
            if ts < time.time():
                ts += 86400  # next day
            return ts
        except ValueError:
            continue
    return None


@register("set_alarm")
def set_alarm(params: dict[str, Any], tts, response_hint: str = "") -> None:
    time_str = params.get("time", "").strip()
    name = params.get("name", "alarm").strip()
    repeat = bool(params.get("repeat", False))

    if not time_str:
        tts.speak("What time should I set the alarm for?")
        return

    ts = _parse_time_str(time_str)
    if ts is None:
        tts.speak(f"Sorry, I didn't understand the time '{time_str}'.")
        return

    with _lock:
        if name in _alarms:
            _alarms[name]["timer"].cancel()
        _schedule_alarm(name, ts, repeat)
    _save()

    alarm_time = datetime.fromtimestamp(ts).strftime("%I:%M %p")
    tts.speak(response_hint or f"Alarm set for {alarm_time}.")


@register("cancel_alarm")
def cancel_alarm(params: dict[str, Any], tts, response_hint: str = "") -> None:
    name = params.get("name", "alarm").strip()
    with _lock:
        entry = _alarms.pop(name, None)
    if entry:
        entry["timer"].cancel()
        _save()
        tts.speak(f"{name.capitalize()} alarm cancelled.")
    else:
        tts.speak(f"I couldn't find an alarm called {name}.")


@register("list_alarms")
def list_alarms(params: dict[str, Any], tts, response_hint: str = "") -> None:
    with _lock:
        if not _alarms:
            tts.speak("You have no alarms set.")
            return
        items = [f"{name} at {v['time_str']}" for name, v in _alarms.items()]
    tts.speak("Your alarms: " + ", ".join(items) + ".")


@register("snooze_alarm")
def snooze_alarm(params: dict[str, Any], tts, response_hint: str = "") -> None:
    minutes = int(params.get("minutes", 9))
    name = params.get("name", "alarm")
    ts = time.time() + minutes * 60
    with _lock:
        if name in _alarms:
            _alarms[name]["timer"].cancel()
        _schedule_alarm(name, ts, repeat=False)
    _save()
    tts.speak(f"Snoozed for {minutes} minutes.")


# Load persisted alarms on import
_load()
