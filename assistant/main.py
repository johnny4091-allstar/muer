"""
Muer Voice Assistant — main entry point.

Usage:
    python -m assistant.main              # normal mode (wake word required)
    python -m assistant.main --text       # text input mode (no mic needed)
    python -m assistant.main --no-wake    # skip wake word, always listening
"""

import argparse
import sys
import threading
import time

from assistant.config import config
from assistant.intent_processor import parse_intent
from assistant.speech_to_text import SpeechToText
from assistant.text_to_speech import TextToSpeech
from assistant.utils.logger import get_logger
import assistant.skills  # noqa: F401 — triggers skill registration

log = get_logger("main")

CHIME_TEXT = f"{config.ASSISTANT_NAME} is listening."


class VoiceAssistant:
    def __init__(self, no_wake: bool = False, text_mode: bool = False) -> None:
        self.no_wake = no_wake
        self.text_mode = text_mode
        self.tts = TextToSpeech()
        self.stt = SpeechToText() if not text_mode else None
        self._active = threading.Event()
        self._stop = threading.Event()

    def _on_wake(self) -> None:
        """Called by wake word detector when wake word is detected."""
        if not self._active.is_set():
            self._active.set()

    def setup(self) -> None:
        log.info(f"Starting {config.ASSISTANT_NAME} Voice Assistant...")
        self.tts.load()
        if self.stt:
            self.stt.load()

    def run(self) -> None:
        self.setup()

        if self.text_mode:
            self._run_text_loop()
            return

        if self.no_wake:
            log.info("Wake word disabled — always listening.")
            self._run_listen_loop(always_on=True)
        else:
            from assistant.wake_word import WakeWordDetector  # noqa: PLC0415
            detector = WakeWordDetector(on_wake=self._on_wake)
            detector.start()
            self.tts.speak(f"Hi, I'm {config.ASSISTANT_NAME}. Say {config.WAKE_WORD.replace('_', ' ')} to get started.")
            self._run_listen_loop(always_on=False)
            detector.stop()

    def _run_listen_loop(self, always_on: bool) -> None:
        log.info("Ready. Waiting for commands...")
        while not self._stop.is_set():
            if always_on or self._active.wait(timeout=0.1):
                self._active.clear()
                self._handle_one_command()

    def _handle_one_command(self) -> None:
        self.tts.speak(CHIME_TEXT)
        log.info("Listening for command...")
        try:
            text = self.stt.listen_and_transcribe()
        except Exception as e:
            log.error(f"STT error: {e}")
            self.tts.speak("Sorry, I had trouble hearing you.")
            return

        if not text.strip():
            self.tts.speak("I didn't catch that.")
            return

        log.info(f"Processing: '{text}'")
        intent_data = parse_intent(text)

        from assistant.skills import dispatch  # noqa: PLC0415
        dispatch(intent_data, self.tts)

    def _run_text_loop(self) -> None:
        """Interactive text-input mode for testing without a microphone."""
        print(f"\n{config.ASSISTANT_NAME} Voice Assistant — Text Mode")
        print("Type your command (or 'quit' to exit)\n")
        while True:
            try:
                text = input("> ").strip()
            except (EOFError, KeyboardInterrupt):
                break
            if text.lower() in ("quit", "exit", "q"):
                break
            if not text:
                continue
            intent_data = parse_intent(text)
            print(f"  Intent: {intent_data}")
            from assistant.skills import dispatch  # noqa: PLC0415
            dispatch(intent_data, self.tts)

    def stop(self) -> None:
        self._stop.set()


def main() -> None:
    parser = argparse.ArgumentParser(description="Muer Voice Assistant")
    parser.add_argument("--no-wake", action="store_true", help="Skip wake word, always listen")
    parser.add_argument("--text", action="store_true", help="Text input mode (no microphone)")
    args = parser.parse_args()

    assistant = VoiceAssistant(no_wake=args.no_wake, text_mode=args.text)
    try:
        assistant.run()
    except KeyboardInterrupt:
        log.info("Shutting down.")
        assistant.stop()
        sys.exit(0)


if __name__ == "__main__":
    main()
