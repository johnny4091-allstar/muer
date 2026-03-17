"""
Jokes, trivia, and fun skill.
"""

import random
from typing import Any

import requests

from assistant.config import config
from assistant.skills import register
from assistant.utils.logger import get_logger

log = get_logger("skill.jokes")

# Fallback jokes when API is unavailable
_FALLBACK_JOKES = [
    ("Why don't scientists trust atoms?", "Because they make up everything!"),
    ("Why did the scarecrow win an award?", "Because he was outstanding in his field!"),
    ("Why can't you give Elsa a balloon?", "Because she'll let it go!"),
    ("What do you call fake spaghetti?", "An impasta!"),
    ("Why did the bicycle fall over?", "Because it was two-tired!"),
    ("What do you call cheese that isn't yours?", "Nacho cheese!"),
    ("Why can't the bicycle stand on its own?", "It's two-tired!"),
    ("What do you call a fish without eyes?", "A fsh!"),
]


def _fetch_joke_api() -> tuple[str, str] | None:
    try:
        r = requests.get("https://official-joke-api.appspot.com/random_joke", timeout=4)
        if r.status_code == 200:
            data = r.json()
            return data["setup"], data["punchline"]
    except Exception:
        pass
    return None


def _ask_claude_joke(joke_type: str) -> str:
    if not config.ANTHROPIC_API_KEY:
        return None
    try:
        import anthropic  # noqa: PLC0415
        client = anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)
        prompt = f"Tell me a {joke_type} joke. Format: just the joke, no intro. Keep it family-friendly and short."
        msg = client.messages.create(
            model=config.CLAUDE_MODEL,
            max_tokens=150,
            messages=[{"role": "user", "content": prompt}],
        )
        return msg.content[0].text.strip()
    except Exception:
        return None


@register("tell_joke")
def tell_joke(params: dict[str, Any], tts, response_hint: str = "") -> None:
    joke_type = params.get("type", "random").strip().lower()

    # Try official joke API first
    result = _fetch_joke_api()
    if result:
        setup, punchline = result
        tts.speak(setup)
        import time  # noqa: PLC0415
        time.sleep(1.5)
        tts.speak(punchline)
        return

    # Try Claude
    joke = _ask_claude_joke(joke_type)
    if joke:
        tts.speak(joke)
        return

    # Fallback
    setup, punchline = random.choice(_FALLBACK_JOKES)
    tts.speak(setup)
    import time  # noqa: PLC0415
    time.sleep(1.5)
    tts.speak(punchline)


@register("tell_fact")
def tell_fact(params: dict[str, Any], tts, response_hint: str = "") -> None:
    topic = params.get("topic", "").strip()
    if not config.ANTHROPIC_API_KEY:
        tts.speak("I need an API key configured to share facts.")
        return
    try:
        import anthropic  # noqa: PLC0415
        client = anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)
        prompt = f"Tell me one interesting {'fact about ' + topic if topic else 'random fact'}. One sentence only, suitable for speech."
        msg = client.messages.create(
            model=config.CLAUDE_MODEL,
            max_tokens=100,
            messages=[{"role": "user", "content": prompt}],
        )
        tts.speak(msg.content[0].text.strip())
    except Exception:
        tts.speak("I couldn't think of a fact right now.")


@register("flip_coin")
def flip_coin(params: dict[str, Any], tts, response_hint: str = "") -> None:
    result = random.choice(["Heads!", "Tails!"])
    tts.speak(result)


@register("roll_dice")
def roll_dice(params: dict[str, Any], tts, response_hint: str = "") -> None:
    sides = int(params.get("sides", 6))
    result = random.randint(1, sides)
    tts.speak(f"You rolled a {result}.")


@register("pick_number")
def pick_number(params: dict[str, Any], tts, response_hint: str = "") -> None:
    low = int(params.get("min", 1))
    high = int(params.get("max", 10))
    result = random.randint(low, high)
    tts.speak(f"I picked {result}.")
