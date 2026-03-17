"""
Text-to-speech using pyttsx3 with espeak backend (offline, Ubuntu-compatible).
"""

import threading

from assistant.config import config
from assistant.utils.logger import get_logger

log = get_logger("tts")


class TextToSpeech:
    def __init__(self) -> None:
        self._engine = None
        self._lock = threading.Lock()

    def load(self) -> None:
        try:
            import pyttsx3  # noqa: PLC0415
            self._engine = pyttsx3.init()
            self._engine.setProperty("rate", config.TTS_RATE)
            self._engine.setProperty("volume", config.TTS_VOLUME)
            # Try to set a natural-sounding voice
            voices = self._engine.getProperty("voices")
            if voices:
                # Prefer English voices
                for voice in voices:
                    if "en" in voice.id.lower() or "english" in voice.name.lower():
                        self._engine.setProperty("voice", voice.id)
                        break
            log.info("TTS engine loaded.")
        except ImportError:
            log.error("pyttsx3 not installed. Install: pip install pyttsx3")
            raise
        except Exception as e:
            log.error(f"TTS init error: {e}")
            raise

    def speak(self, text: str) -> None:
        """Synthesize and play speech (blocking)."""
        if not text:
            return
        log.info(f"Speaking: '{text}'")
        with self._lock:
            if self._engine:
                self._engine.say(text)
                self._engine.runAndWait()
            else:
                # Fallback: espeak via subprocess
                import subprocess  # noqa: PLC0415
                subprocess.run(
                    ["espeak", "-s", str(config.TTS_RATE), text],
                    check=False,
                    capture_output=True,
                )

    def speak_async(self, text: str) -> threading.Thread:
        """Speak without blocking the caller."""
        t = threading.Thread(target=self.speak, args=(text,), daemon=True)
        t.start()
        return t
