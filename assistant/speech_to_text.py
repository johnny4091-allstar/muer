"""
Speech-to-text using faster-whisper (local Whisper model).
Records from microphone until silence, then transcribes.
"""

import io
import struct
import wave

import pyaudio

from assistant.config import config
from assistant.utils.audio_utils import get_audio_interface, open_mic_stream, record_until_silence
from assistant.utils.logger import get_logger

log = get_logger("stt")


class SpeechToText:
    def __init__(self) -> None:
        self._model = None
        self._pa: pyaudio.PyAudio | None = None

    def load(self) -> None:
        """Load the Whisper model (call once at startup)."""
        try:
            from faster_whisper import WhisperModel  # noqa: PLC0415
            log.info(f"Loading Whisper model '{config.STT_MODEL}' on {config.STT_DEVICE}...")
            self._model = WhisperModel(
                config.STT_MODEL,
                device=config.STT_DEVICE,
                compute_type="int8" if config.STT_DEVICE == "cpu" else "float16",
            )
            log.info("Whisper model loaded.")
        except ImportError:
            log.error("faster-whisper not installed. Install: pip install faster-whisper")
            raise

    def listen_and_transcribe(self) -> str:
        """Open mic, record until silence, and return transcribed text."""
        if self._model is None:
            raise RuntimeError("SpeechToText not loaded. Call .load() first.")

        pa = get_audio_interface()
        stream = open_mic_stream(pa)

        try:
            audio_bytes = record_until_silence(stream)
        finally:
            stream.stop_stream()
            stream.close()
            pa.terminate()

        if not audio_bytes:
            return ""

        # Write to in-memory WAV for whisper
        wav_buffer = io.BytesIO()
        with wave.open(wav_buffer, "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)  # 16-bit
            wf.setframerate(config.AUDIO_SAMPLE_RATE)
            wf.writeframes(audio_bytes)
        wav_buffer.seek(0)

        segments, _ = self._model.transcribe(
            wav_buffer,
            language=config.STT_LANGUAGE,
            beam_size=5,
            vad_filter=True,
        )
        text = " ".join(seg.text for seg in segments).strip()
        log.info(f"Transcribed: '{text}'")
        return text
