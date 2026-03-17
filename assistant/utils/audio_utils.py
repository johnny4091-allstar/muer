"""Audio utilities: VAD, silence detection, microphone helpers."""

import array
import math
from typing import Generator

import pyaudio

from assistant.config import config
from assistant.utils.logger import get_logger

log = get_logger("audio")


def get_audio_interface() -> pyaudio.PyAudio:
    return pyaudio.PyAudio()


def list_input_devices() -> list[dict]:
    pa = get_audio_interface()
    devices = []
    for i in range(pa.get_device_count()):
        info = pa.get_device_info_by_index(i)
        if info["maxInputChannels"] > 0:
            devices.append({"index": i, "name": info["name"]})
    pa.terminate()
    return devices


def rms(data: bytes) -> float:
    """Root mean square of raw 16-bit PCM audio bytes."""
    count = len(data) // 2
    shorts = array.array("h", data)
    sum_sq = sum(s * s for s in shorts)
    return math.sqrt(sum_sq / count) / 32768.0 if count else 0.0


def record_until_silence(stream: pyaudio.Stream) -> bytes:
    """Record audio until silence or max duration reached. Returns raw PCM bytes."""
    frames: list[bytes] = []
    silent_chunks = 0
    required_silent_chunks = int(
        config.SILENCE_DURATION * config.AUDIO_SAMPLE_RATE / config.AUDIO_CHUNK_SIZE
    )
    max_chunks = int(
        config.MAX_RECORD_SECONDS * config.AUDIO_SAMPLE_RATE / config.AUDIO_CHUNK_SIZE
    )

    log.debug("Recording until silence...")
    for _ in range(max_chunks):
        chunk = stream.read(config.AUDIO_CHUNK_SIZE, exception_on_overflow=False)
        frames.append(chunk)
        if rms(chunk) < config.SILENCE_THRESHOLD:
            silent_chunks += 1
            if silent_chunks >= required_silent_chunks:
                break
        else:
            silent_chunks = 0

    log.debug(f"Recorded {len(frames)} chunks ({len(frames) * config.AUDIO_CHUNK_SIZE / config.AUDIO_SAMPLE_RATE:.1f}s)")
    return b"".join(frames)


def open_mic_stream(pa: pyaudio.PyAudio) -> pyaudio.Stream:
    kwargs: dict = dict(
        format=pyaudio.paInt16,
        channels=1,
        rate=config.AUDIO_SAMPLE_RATE,
        input=True,
        frames_per_buffer=config.AUDIO_CHUNK_SIZE,
    )
    if config.AUDIO_DEVICE_INDEX is not None:
        kwargs["input_device_index"] = config.AUDIO_DEVICE_INDEX
    return pa.open(**kwargs)
