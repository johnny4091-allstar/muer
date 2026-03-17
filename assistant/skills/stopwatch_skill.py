"""Stopwatch skill: start, stop, lap, reset."""

import time
from typing import Any

from assistant.skills import register
from assistant.utils.logger import get_logger

log = get_logger("skill.stopwatch")

_start_time: float | None = None
_laps: list[float] = []
_elapsed_at_stop: float = 0.0
_running: bool = False


@register("stopwatch_start")
def stopwatch_start(params: dict[str, Any], tts, response_hint: str = "") -> None:
    global _start_time, _running, _elapsed_at_stop
    if _running:
        tts.speak("Stopwatch is already running.")
        return
    _start_time = time.time() - _elapsed_at_stop
    _running = True
    tts.speak("Stopwatch started.")


@register("stopwatch_stop")
def stopwatch_stop(params: dict[str, Any], tts, response_hint: str = "") -> None:
    global _running, _elapsed_at_stop
    if not _running:
        tts.speak("Stopwatch is not running.")
        return
    _elapsed_at_stop = time.time() - _start_time
    _running = False
    tts.speak(f"Stopwatch stopped at {_format_elapsed(_elapsed_at_stop)}.")


@register("stopwatch_lap")
def stopwatch_lap(params: dict[str, Any], tts, response_hint: str = "") -> None:
    if not _running:
        tts.speak("Start the stopwatch first.")
        return
    elapsed = time.time() - _start_time
    _laps.append(elapsed)
    lap_num = len(_laps)
    prev = _laps[-2] if len(_laps) > 1 else 0
    lap_time = elapsed - prev
    tts.speak(f"Lap {lap_num}: {_format_elapsed(lap_time)}. Total: {_format_elapsed(elapsed)}.")


@register("stopwatch_reset")
def stopwatch_reset(params: dict[str, Any], tts, response_hint: str = "") -> None:
    global _start_time, _laps, _elapsed_at_stop, _running
    _start_time = None
    _laps = []
    _elapsed_at_stop = 0.0
    _running = False
    tts.speak("Stopwatch reset.")


@register("stopwatch_read")
def stopwatch_read(params: dict[str, Any], tts, response_hint: str = "") -> None:
    if not _running and _elapsed_at_stop == 0:
        tts.speak("Stopwatch is not running.")
        return
    elapsed = (time.time() - _start_time) if _running else _elapsed_at_stop
    tts.speak(f"Elapsed time: {_format_elapsed(elapsed)}.")


def _format_elapsed(seconds: float) -> str:
    s = int(seconds)
    ms = int((seconds - s) * 10)
    m, s = divmod(s, 60)
    h, m = divmod(m, 60)
    if h:
        return f"{h} hour{'s' if h != 1 else ''}, {m} minute{'s' if m != 1 else ''}, {s}.{ms} seconds"
    if m:
        return f"{m} minute{'s' if m != 1 else ''} and {s}.{ms} seconds"
    return f"{s}.{ms} seconds"
