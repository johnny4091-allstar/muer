"""
Global TTS reference so timer/alarm/reminder callbacks can speak
without circular imports.
Set by main.py at startup.
"""

_tts = None


def set_tts(tts_instance) -> None:
    global _tts
    _tts = tts_instance


def speak(text: str) -> None:
    if _tts is not None:
        _tts.speak(text)
