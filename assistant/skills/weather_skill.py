"""
Weather skill: fetch current weather via OpenWeatherMap API.
Falls back to a simple message if no API key is configured.
"""

from typing import Any

import requests

from assistant.config import config
from assistant.skills import register
from assistant.utils.logger import get_logger

log = get_logger("skill.weather")

OWM_URL = "https://api.openweathermap.org/data/2.5/weather"


def _fetch_weather(city: str) -> str:
    if not config.OPENWEATHERMAP_API_KEY:
        return f"I don't have a weather API key configured. You can get one at openweathermap.org."

    try:
        resp = requests.get(
            OWM_URL,
            params={
                "q": city,
                "appid": config.OPENWEATHERMAP_API_KEY,
                "units": "imperial",
            },
            timeout=5,
        )
        data = resp.json()

        if resp.status_code != 200:
            return f"I couldn't get the weather for {city}."

        temp = round(data["main"]["temp"])
        feels_like = round(data["main"]["feels_like"])
        description = data["weather"][0]["description"]
        humidity = data["main"]["humidity"]

        return (
            f"In {city}, it's currently {temp} degrees Fahrenheit "
            f"and {description}. "
            f"It feels like {feels_like} degrees, with {humidity} percent humidity."
        )
    except requests.RequestException as e:
        log.error(f"Weather fetch failed: {e}")
        return "Sorry, I couldn't fetch the weather right now."


@register("get_weather")
def get_weather(params: dict[str, Any], tts, response_hint: str = "") -> None:
    city = params.get("city", config.DEFAULT_WEATHER_CITY).strip()
    if not city:
        city = config.DEFAULT_WEATHER_CITY
    weather_text = _fetch_weather(city)
    tts.speak(weather_text)
