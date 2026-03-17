"""
System control skill: volume up/down/set/mute using pactl (PulseAudio/PipeWire).
Falls back to amixer for older Ubuntu setups.
"""

import subprocess
import shutil
from typing import Any

from assistant.skills import register
from assistant.utils.logger import get_logger

log = get_logger("skill.system")


def _use_pactl() -> bool:
    return shutil.which("pactl") is not None


def _set_volume_delta(delta: int) -> None:
    sign = "+" if delta >= 0 else "-"
    amount = abs(delta)
    if _use_pactl():
        subprocess.run(
            ["pactl", "set-sink-volume", "@DEFAULT_SINK@", f"{sign}{amount}%"],
            check=False,
        )
    else:
        direction = "+" if delta >= 0 else "-"
        subprocess.run(
            ["amixer", "sset", "Master", f"{amount}%{direction}"],
            check=False,
        )


def _set_volume_absolute(level: int) -> None:
    level = max(0, min(100, level))
    if _use_pactl():
        subprocess.run(
            ["pactl", "set-sink-volume", "@DEFAULT_SINK@", f"{level}%"],
            check=False,
        )
    else:
        subprocess.run(
            ["amixer", "sset", "Master", f"{level}%"],
            check=False,
        )


@register("volume_up")
def volume_up(params: dict[str, Any], tts, response_hint: str = "") -> None:
    amount = int(params.get("amount", 10))
    _set_volume_delta(amount)
    tts.speak(response_hint or f"Volume up by {amount} percent.")


@register("volume_down")
def volume_down(params: dict[str, Any], tts, response_hint: str = "") -> None:
    amount = int(params.get("amount", 10))
    _set_volume_delta(-amount)
    tts.speak(response_hint or f"Volume down by {amount} percent.")


@register("volume_set")
def volume_set(params: dict[str, Any], tts, response_hint: str = "") -> None:
    level = int(params.get("level", 50))
    _set_volume_absolute(level)
    tts.speak(response_hint or f"Volume set to {level} percent.")


@register("mute")
def mute(params: dict[str, Any], tts, response_hint: str = "") -> None:
    if _use_pactl():
        subprocess.run(["pactl", "set-sink-mute", "@DEFAULT_SINK@", "1"], check=False)
    else:
        subprocess.run(["amixer", "sset", "Master", "mute"], check=False)
    tts.speak(response_hint or "Muted.")


@register("unmute")
def unmute(params: dict[str, Any], tts, response_hint: str = "") -> None:
    if _use_pactl():
        subprocess.run(["pactl", "set-sink-mute", "@DEFAULT_SINK@", "0"], check=False)
    else:
        subprocess.run(["amixer", "sset", "Master", "unmute"], check=False)
    tts.speak(response_hint or "Unmuted.")
