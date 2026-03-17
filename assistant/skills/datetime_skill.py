"""
Date/time skill: tells the current time and date.
"""

from datetime import datetime
from typing import Any

from assistant.skills import register
from assistant.utils.logger import get_logger

log = get_logger("skill.datetime")


@register("get_time")
def get_time(params: dict[str, Any], tts, response_hint: str = "") -> None:
    now = datetime.now()
    hour = now.strftime("%I").lstrip("0") or "12"
    minute = now.strftime("%M")
    ampm = now.strftime("%p").lower()
    text = f"The time is {hour}:{minute} {ampm}."
    tts.speak(text)


@register("get_date")
def get_date(params: dict[str, Any], tts, response_hint: str = "") -> None:
    now = datetime.now()
    day_name = now.strftime("%A")
    month = now.strftime("%B")
    day = now.day
    year = now.year
    # ordinal suffix
    suffix = "th" if 11 <= day <= 13 else {1: "st", 2: "nd", 3: "rd"}.get(day % 10, "th")
    text = f"Today is {day_name}, {month} {day}{suffix}, {year}."
    tts.speak(text)
