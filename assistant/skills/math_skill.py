"""
Math skill: arithmetic, unit conversions, currency, percentage calculations.
Uses Claude for natural language math + simple eval for basic arithmetic.
"""

import re
from typing import Any

from assistant.config import config
from assistant.skills import register
from assistant.utils.logger import get_logger

log = get_logger("skill.math")

# Unit conversion table (to SI base)
_LENGTH = {"mm": 0.001, "cm": 0.01, "m": 1, "km": 1000, "inch": 0.0254, "inches": 0.0254,
           "foot": 0.3048, "feet": 0.3048, "ft": 0.3048, "yard": 0.9144, "mile": 1609.344, "miles": 1609.344}
_WEIGHT = {"mg": 0.001, "g": 1, "kg": 1000, "lb": 453.592, "lbs": 453.592, "pound": 453.592,
           "pounds": 453.592, "oz": 28.3495, "ounce": 28.3495, "ounces": 28.3495, "ton": 907185}
_TEMP_SPECIAL = True  # handled separately
_VOLUME = {"ml": 0.001, "l": 1, "liter": 1, "liters": 1, "gallon": 3.78541, "gallons": 3.78541,
           "cup": 0.236588, "cups": 0.236588, "pint": 0.473176, "quart": 0.946353}

_UNIT_GROUPS = [_LENGTH, _WEIGHT, _VOLUME]


def _convert_units(amount: float, from_unit: str, to_unit: str) -> str:
    fu, tu = from_unit.lower(), to_unit.lower()

    # Temperature special case
    temp_map = {"c": "celsius", "f": "fahrenheit", "k": "kelvin",
                "celsius": "celsius", "fahrenheit": "fahrenheit", "kelvin": "kelvin"}
    if fu in temp_map and tu in temp_map:
        fu, tu = temp_map[fu], temp_map[tu]
        if fu == tu:
            return f"{amount} {from_unit}"
        if fu == "celsius":
            val = amount * 9/5 + 32 if tu == "fahrenheit" else amount + 273.15
        elif fu == "fahrenheit":
            val = (amount - 32) * 5/9 if tu == "celsius" else (amount - 32) * 5/9 + 273.15
        else:  # kelvin
            val = amount - 273.15 if tu == "celsius" else (amount - 273.15) * 9/5 + 32
        return f"{amount} {from_unit} is {val:.2f} {to_unit}"

    for group in _UNIT_GROUPS:
        if fu in group and tu in group:
            base = amount * group[fu]
            result = base / group[tu]
            return f"{amount} {from_unit} is {result:.4g} {to_unit}"

    return f"I don't know how to convert {from_unit} to {to_unit}."


def _safe_eval(expr: str) -> str | None:
    """Safely evaluate a math expression."""
    # Allow only numbers and math operators
    clean = re.sub(r"[^0-9+\-*/().% ]", "", expr).strip()
    if not clean:
        return None
    try:
        result = eval(clean, {"__builtins__": {}})  # noqa: S307
        return str(round(float(result), 10)).rstrip("0").rstrip(".")
    except Exception:
        return None


def _ask_claude(question: str) -> str:
    if not config.ANTHROPIC_API_KEY:
        return "I need an API key to answer that math question."
    try:
        import anthropic  # noqa: PLC0415
        client = anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)
        msg = client.messages.create(
            model=config.CLAUDE_MODEL,
            max_tokens=100,
            system="Answer the math or conversion question in one short sentence suitable for speech. Only the answer, no working shown.",
            messages=[{"role": "user", "content": question}],
        )
        return msg.content[0].text.strip()
    except Exception as e:
        log.error(f"Claude math failed: {e}")
        return "I couldn't calculate that."


@register("calculate")
def calculate(params: dict[str, Any], tts, response_hint: str = "") -> None:
    expression = params.get("expression", "").strip()
    if not expression:
        tts.speak("What would you like me to calculate?")
        return

    # Try unit conversion pattern first
    m = re.match(r"([\d.]+)\s*(\w+)\s+(?:to|in)\s+(\w+)", expression, re.IGNORECASE)
    if m:
        amount, from_u, to_u = float(m.group(1)), m.group(2), m.group(3)
        tts.speak(_convert_units(amount, from_u, to_u))
        return

    # Try simple arithmetic
    result = _safe_eval(expression)
    if result:
        tts.speak(f"{expression} equals {result}.")
        return

    # Fallback to Claude
    tts.speak(_ask_claude(expression))


@register("convert_units")
def convert_units(params: dict[str, Any], tts, response_hint: str = "") -> None:
    amount = float(params.get("amount", 1))
    from_unit = params.get("from_unit", "").strip()
    to_unit = params.get("to_unit", "").strip()
    if not from_unit or not to_unit:
        tts.speak("Please specify the units to convert between.")
        return
    tts.speak(_convert_units(amount, from_unit, to_unit))


@register("percentage")
def percentage(params: dict[str, Any], tts, response_hint: str = "") -> None:
    pct = float(params.get("percent", 0))
    of = float(params.get("of", 100))
    result = round(pct / 100 * of, 2)
    tts.speak(f"{pct} percent of {of} is {result}.")
