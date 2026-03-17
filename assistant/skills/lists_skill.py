"""
Lists skill: shopping lists, to-do lists, and any named list.
Persists to disk.
"""

import json
from pathlib import Path
from typing import Any

from assistant.config import config
from assistant.skills import register
from assistant.utils.logger import get_logger

log = get_logger("skill.lists")

_DATA_FILE = Path(config.DATA_DIR) / "lists.json"
_lists: dict[str, list[str]] = {}


def _save() -> None:
    _DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    _DATA_FILE.write_text(json.dumps(_lists, indent=2))


def _load() -> None:
    if _DATA_FILE.exists():
        try:
            _lists.update(json.loads(_DATA_FILE.read_text()))
        except Exception:
            pass


def _normalize(name: str) -> str:
    return name.lower().strip().replace(" list", "").strip() or "shopping"


@register("list_add")
def list_add(params: dict[str, Any], tts, response_hint: str = "") -> None:
    item = params.get("item", "").strip()
    list_name = _normalize(params.get("list", "shopping"))
    if not item:
        tts.speak("What would you like to add?")
        return
    _lists.setdefault(list_name, [])
    if item.lower() not in [i.lower() for i in _lists[list_name]]:
        _lists[list_name].append(item)
        _save()
    tts.speak(response_hint or f"Added {item} to your {list_name} list.")


@register("list_remove")
def list_remove(params: dict[str, Any], tts, response_hint: str = "") -> None:
    item = params.get("item", "").strip().lower()
    list_name = _normalize(params.get("list", "shopping"))
    lst = _lists.get(list_name, [])
    new_lst = [i for i in lst if i.lower() != item]
    if len(new_lst) < len(lst):
        _lists[list_name] = new_lst
        _save()
        tts.speak(f"Removed {item} from your {list_name} list.")
    else:
        tts.speak(f"I couldn't find {item} on your {list_name} list.")


@register("list_show")
def list_show(params: dict[str, Any], tts, response_hint: str = "") -> None:
    list_name = _normalize(params.get("list", "shopping"))
    items = _lists.get(list_name, [])
    if not items:
        tts.speak(f"Your {list_name} list is empty.")
    else:
        tts.speak(f"Your {list_name} list has {len(items)} items: {', '.join(items)}.")


@register("list_clear")
def list_clear(params: dict[str, Any], tts, response_hint: str = "") -> None:
    list_name = _normalize(params.get("list", "shopping"))
    _lists[list_name] = []
    _save()
    tts.speak(f"Your {list_name} list has been cleared.")


_load()
