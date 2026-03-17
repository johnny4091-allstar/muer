"""
Smart home skill: Home Assistant integration.
Configure HA_URL and HA_TOKEN in .env to enable.
"""

from typing import Any

import requests

from assistant.config import config
from assistant.skills import register
from assistant.utils.logger import get_logger

log = get_logger("skill.smarthome")


def _ha_call(endpoint: str, method: str = "GET", data: dict | None = None) -> dict | None:
    if not config.HA_URL or not config.HA_TOKEN:
        return None
    url = f"{config.HA_URL.rstrip('/')}/api/{endpoint}"
    headers = {"Authorization": f"Bearer {config.HA_TOKEN}", "Content-Type": "application/json"}
    try:
        r = requests.request(method, url, headers=headers, json=data, timeout=5)
        return r.json() if r.content else {}
    except Exception as e:
        log.error(f"Home Assistant call failed: {e}")
        return None


def _get_entity_id(name: str, domain: str) -> str | None:
    """Find entity_id by friendly name."""
    states = _ha_call("states")
    if not states:
        return None
    name_lower = name.lower()
    for state in states:
        entity_id = state.get("entity_id", "")
        if not entity_id.startswith(domain):
            continue
        attrs = state.get("attributes", {})
        friendly = attrs.get("friendly_name", "").lower()
        if name_lower in friendly or friendly in name_lower:
            return entity_id
    return None


@register("light_on")
def light_on(params: dict[str, Any], tts, response_hint: str = "") -> None:
    if not config.HA_URL:
        tts.speak("Home Assistant is not configured.")
        return
    location = params.get("location", "").strip()
    entity_id = _get_entity_id(location, "light") if location else None
    data = {"entity_id": entity_id or "light.all_lights"}
    brightness = params.get("brightness")
    if brightness:
        data["brightness_pct"] = int(brightness)
    result = _ha_call("services/light/turn_on", "POST", data)
    if result is not None:
        tts.speak(response_hint or f"Turning on {'the ' + location + ' light' if location else 'the lights'}.")
    else:
        tts.speak("I couldn't reach Home Assistant.")


@register("light_off")
def light_off(params: dict[str, Any], tts, response_hint: str = "") -> None:
    if not config.HA_URL:
        tts.speak("Home Assistant is not configured.")
        return
    location = params.get("location", "").strip()
    entity_id = _get_entity_id(location, "light") if location else None
    data = {"entity_id": entity_id or "light.all_lights"}
    result = _ha_call("services/light/turn_off", "POST", data)
    if result is not None:
        tts.speak(response_hint or f"Turning off {'the ' + location + ' light' if location else 'the lights'}.")
    else:
        tts.speak("I couldn't reach Home Assistant.")


@register("light_dim")
def light_dim(params: dict[str, Any], tts, response_hint: str = "") -> None:
    location = params.get("location", "").strip()
    level = int(params.get("level", 30))
    entity_id = _get_entity_id(location, "light") if location else None
    data = {"entity_id": entity_id or "light.all_lights", "brightness_pct": level}
    result = _ha_call("services/light/turn_on", "POST", data)
    if result is not None:
        tts.speak(f"Dimming {'the ' + location + ' lights' if location else 'lights'} to {level} percent.")
    else:
        tts.speak("I couldn't reach Home Assistant.")


@register("set_thermostat")
def set_thermostat(params: dict[str, Any], tts, response_hint: str = "") -> None:
    if not config.HA_URL:
        tts.speak("Home Assistant is not configured.")
        return
    temp = params.get("temperature")
    entity_id = _get_entity_id("thermostat", "climate") or "climate.thermostat"
    data = {"entity_id": entity_id, "temperature": float(temp)}
    result = _ha_call("services/climate/set_temperature", "POST", data)
    if result is not None:
        tts.speak(f"Setting thermostat to {temp} degrees.")
    else:
        tts.speak("I couldn't reach Home Assistant.")


@register("lock_door")
def lock_door(params: dict[str, Any], tts, response_hint: str = "") -> None:
    if not config.HA_URL:
        tts.speak("Home Assistant is not configured.")
        return
    location = params.get("location", "front").strip()
    entity_id = _get_entity_id(location, "lock") or "lock.front_door"
    data = {"entity_id": entity_id}
    result = _ha_call("services/lock/lock", "POST", data)
    if result is not None:
        tts.speak(f"Locking the {location} door.")
    else:
        tts.speak("I couldn't reach Home Assistant.")


@register("get_home_status")
def get_home_status(params: dict[str, Any], tts, response_hint: str = "") -> None:
    if not config.HA_URL:
        tts.speak("Home Assistant is not configured.")
        return
    states = _ha_call("states")
    if not states:
        tts.speak("I couldn't get the home status.")
        return
    lights_on = sum(1 for s in states if s.get("entity_id", "").startswith("light") and s.get("state") == "on")
    tts.speak(f"Currently {lights_on} light{'s' if lights_on != 1 else ''} are on.")
