"""
Wake word detection using openwakeword.
Streams microphone audio and fires a callback when the wake word is detected.
"""

import threading
from typing import Callable

import numpy as np
import pyaudio

from assistant.config import config
from assistant.utils.audio_utils import get_audio_interface, open_mic_stream
from assistant.utils.logger import get_logger

log = get_logger("wake_word")


class WakeWordDetector:
    """Listens on the microphone for the configured wake word."""

    def __init__(self, on_wake: Callable[[], None]) -> None:
        self.on_wake = on_wake
        self._running = False
        self._thread: threading.Thread | None = None
        self._pa: pyaudio.PyAudio | None = None
        self._oww = None

    def _load_model(self) -> None:
        try:
            from openwakeword.model import Model  # noqa: PLC0415
            self._oww = Model(
                wakeword_models=[config.WAKE_WORD],
                inference_framework="onnx",
            )
            log.info(f"Loaded wake word model: {config.WAKE_WORD}")
        except Exception as e:
            log.error(f"Failed to load openwakeword model: {e}")
            log.info("Falling back to keyword in transcript mode (no wake word detection).")
            self._oww = None

    def start(self) -> None:
        self._load_model()
        self._running = True
        self._thread = threading.Thread(target=self._listen_loop, daemon=True)
        self._thread.start()
        log.info(f"Wake word detector started. Say '{config.WAKE_WORD.replace('_', ' ')}' to activate.")

    def stop(self) -> None:
        self._running = False
        if self._pa:
            self._pa.terminate()

    def _listen_loop(self) -> None:
        self._pa = get_audio_interface()
        stream = open_mic_stream(self._pa)
        log.debug("Wake word listen loop running...")

        try:
            while self._running:
                raw = stream.read(config.AUDIO_CHUNK_SIZE, exception_on_overflow=False)
                # openwakeword expects int16 numpy array
                audio_int16 = np.frombuffer(raw, dtype=np.int16)

                if self._oww is not None:
                    self._oww.predict(audio_int16)
                    for model_name, scores in self._oww.prediction_buffer.items():
                        if scores[-1] >= config.WAKE_WORD_THRESHOLD:
                            log.info(f"Wake word detected! (score={scores[-1]:.2f})")
                            self._oww.reset()
                            self.on_wake()
                            break
        except Exception as e:
            if self._running:
                log.error(f"Wake word loop error: {e}")
        finally:
            stream.stop_stream()
            stream.close()
