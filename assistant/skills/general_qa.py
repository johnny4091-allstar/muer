"""
General Q&A skill: answers open-ended questions using Claude API.
"""

from typing import Any

from assistant.config import config
from assistant.skills import register
from assistant.utils.logger import get_logger

log = get_logger("skill.qa")

QA_SYSTEM_PROMPT = (
    "You are a helpful voice assistant. Answer the user's question concisely "
    "in 1-3 short sentences suitable for speech. Do not use lists, markdown, "
    "or special characters. Speak naturally."
)


@register("general_question")
def general_question(params: dict[str, Any], tts, response_hint: str = "") -> None:
    question = params.get("question", "").strip()
    if not question:
        tts.speak("I didn't catch that. Could you repeat your question?")
        return

    if not config.ANTHROPIC_API_KEY:
        tts.speak("I need an API key configured to answer questions.")
        return

    try:
        import anthropic  # noqa: PLC0415
        client = anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)
        message = client.messages.create(
            model=config.CLAUDE_MODEL,
            max_tokens=200,
            system=QA_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": question}],
        )
        answer = message.content[0].text.strip()
        log.info(f"Q: {question} → A: {answer}")
        tts.speak(answer)
    except Exception as e:
        log.error(f"Claude Q&A failed: {e}")
        tts.speak("I'm having trouble answering that right now.")


@register("unknown")
def unknown(params: dict[str, Any], tts, response_hint: str = "") -> None:
    tts.speak("I'm not sure how to help with that. Try asking again differently.")
