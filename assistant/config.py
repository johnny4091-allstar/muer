"""
Configuration for Muer Voice Assistant.
Reads from environment variables or .env file.
"""

import os
from pathlib import Path

# Load .env if present
try:
    from dotenv import load_dotenv
    _env_path = Path(__file__).parent.parent / ".env"
    if _env_path.exists():
        load_dotenv(_env_path)
except ImportError:
    pass


class Config:
    # Assistant identity
    ASSISTANT_NAME: str = os.getenv("ASSISTANT_NAME", "Muer")
    WAKE_WORD: str = os.getenv("WAKE_WORD", "hey_jarvis")
    WAKE_WORD_THRESHOLD: float = float(os.getenv("WAKE_WORD_THRESHOLD", "0.5"))

    # Claude API
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    CLAUDE_MODEL: str = os.getenv("CLAUDE_MODEL", "claude-haiku-4-5-20251001")

    # Speech-to-text (faster-whisper)
    STT_MODEL: str = os.getenv("STT_MODEL", "base")  # tiny|base|small|medium|large
    STT_LANGUAGE: str = os.getenv("STT_LANGUAGE", "en")
    STT_DEVICE: str = os.getenv("STT_DEVICE", "cpu")  # cpu|cuda

    # Audio
    AUDIO_DEVICE_INDEX: int | None = (
        int(os.getenv("AUDIO_DEVICE_INDEX")) if os.getenv("AUDIO_DEVICE_INDEX") else None
    )
    AUDIO_SAMPLE_RATE: int = int(os.getenv("AUDIO_SAMPLE_RATE", "16000"))
    AUDIO_CHUNK_SIZE: int = int(os.getenv("AUDIO_CHUNK_SIZE", "1280"))  # 80ms @ 16kHz
    SILENCE_THRESHOLD: float = float(os.getenv("SILENCE_THRESHOLD", "0.03"))
    SILENCE_DURATION: float = float(os.getenv("SILENCE_DURATION", "1.5"))  # seconds
    MAX_RECORD_SECONDS: int = int(os.getenv("MAX_RECORD_SECONDS", "10"))

    # TTS
    TTS_RATE: int = int(os.getenv("TTS_RATE", "175"))  # words per minute
    TTS_VOLUME: float = float(os.getenv("TTS_VOLUME", "1.0"))

    # Skills
    OPENWEATHERMAP_API_KEY: str = os.getenv("OPENWEATHERMAP_API_KEY", "")
    DEFAULT_WEATHER_CITY: str = os.getenv("DEFAULT_WEATHER_CITY", "New York")

    # Muer integration
    MUER_BASE_URL: str = os.getenv("MUER_BASE_URL", "http://localhost:3000")

    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FILE: str = os.getenv("LOG_FILE", "/tmp/muer-assistant.log")


config = Config()
