"""
Notes skill: take, read back, and clear voice notes.
"""

import json
from datetime import datetime
from pathlib import Path
from typing import Any

from assistant.config import config
from assistant.skills import register
from assistant.utils.logger import get_logger

log = get_logger("skill.notes")

_DATA_FILE = Path(config.DATA_DIR) / "notes.json"
_notes: list[dict] = []


def _save() -> None:
    _DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    _DATA_FILE.write_text(json.dumps(_notes, indent=2))


def _load() -> None:
    if _DATA_FILE.exists():
        try:
            _notes.extend(json.loads(_DATA_FILE.read_text()))
        except Exception:
            pass


@register("take_note")
def take_note(params: dict[str, Any], tts, response_hint: str = "") -> None:
    content = params.get("content", "").strip()
    if not content:
        tts.speak("What would you like to note?")
        return
    _notes.append({"content": content, "time": datetime.now().isoformat()})
    _save()
    tts.speak(response_hint or f"Note saved: {content}")


@register("read_notes")
def read_notes(params: dict[str, Any], tts, response_hint: str = "") -> None:
    if not _notes:
        tts.speak("You have no saved notes.")
        return
    count = len(_notes)
    last = _notes[-1]["content"]
    if count == 1:
        tts.speak(f"You have one note: {last}")
    else:
        tts.speak(f"You have {count} notes. Your latest note is: {last}")


@register("clear_notes")
def clear_notes(params: dict[str, Any], tts, response_hint: str = "") -> None:
    _notes.clear()
    _save()
    tts.speak("All notes cleared.")


_load()
