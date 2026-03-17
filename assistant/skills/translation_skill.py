"""
Translation and spelling skill via Claude.
"""

from typing import Any

from assistant.config import config
from assistant.skills import register
from assistant.utils.logger import get_logger

log = get_logger("skill.translation")


def _ask_claude(prompt: str) -> str:
    if not config.ANTHROPIC_API_KEY:
        return "I need an API key configured to translate."
    try:
        import anthropic  # noqa: PLC0415
        client = anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)
        msg = client.messages.create(
            model=config.CLAUDE_MODEL,
            max_tokens=150,
            system="Respond concisely in a way suitable for speech synthesis. No markdown.",
            messages=[{"role": "user", "content": prompt}],
        )
        return msg.content[0].text.strip()
    except Exception as e:
        log.error(f"Claude call failed: {e}")
        return "I couldn't complete that request."


@register("translate")
def translate(params: dict[str, Any], tts, response_hint: str = "") -> None:
    text = params.get("text", "").strip()
    language = params.get("language", "").strip()
    if not text or not language:
        tts.speak("Please provide text and a target language.")
        return
    result = _ask_claude(f"Translate '{text}' to {language}. Say: In {language}, that is: [translation]")
    tts.speak(result)


@register("spell_word")
def spell_word(params: dict[str, Any], tts, response_hint: str = "") -> None:
    word = params.get("word", "").strip()
    if not word:
        tts.speak("What word would you like me to spell?")
        return
    spelled = " ".join(word.upper())
    tts.speak(f"{word} is spelled: {spelled}.")


@register("word_definition")
def word_definition(params: dict[str, Any], tts, response_hint: str = "") -> None:
    word = params.get("word", "").strip()
    if not word:
        tts.speak("What word would you like defined?")
        return
    result = _ask_claude(f"Define the word '{word}' in one sentence suitable for speech.")
    tts.speak(result)


@register("synonym")
def synonym(params: dict[str, Any], tts, response_hint: str = "") -> None:
    word = params.get("word", "").strip()
    if not word:
        tts.speak("What word do you want synonyms for?")
        return
    result = _ask_claude(f"Give 3 synonyms for the word '{word}'. Format: '{word}' can also be said as: [synonym 1], [synonym 2], or [synonym 3].")
    tts.speak(result)
