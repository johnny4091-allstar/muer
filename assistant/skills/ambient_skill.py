"""
Ambient sounds and internet radio skill.
"""

import subprocess
import threading
from typing import Any

from assistant.skills import register
from assistant.utils.logger import get_logger

log = get_logger("skill.ambient")

# Named ambient sound search queries for YouTube
_AMBIENT_SOUNDS = {
    "rain": "rain sounds 1 hour relaxing",
    "ocean": "ocean waves sounds 1 hour",
    "forest": "forest nature sounds birds 1 hour",
    "fireplace": "fireplace crackling sounds 1 hour",
    "white noise": "white noise 1 hour sleep",
    "brown noise": "brown noise 1 hour focus",
    "cafe": "coffee shop ambient noise 1 hour",
    "thunderstorm": "thunderstorm rain sounds 1 hour",
    "fan": "fan noise white noise 1 hour",
    "sleep": "sleep music calm relaxing 1 hour",
    "focus": "focus music study concentration",
    "meditation": "meditation music calm 1 hour",
}

# Internet radio station stream URLs
_RADIO_STATIONS = {
    "npr": "https://npr-ice.streamguys1.com/live.mp3",
    "bbc world": "http://stream.live.vc.bbcmedia.co.uk/bbc_world_service",
    "bbc radio 1": "http://stream.live.vc.bbcmedia.co.uk/bbc_radio_one",
    "jazz": "http://jazz.streamr.ru/jazz-64.mp3",
    "classical": "http://radio.streemlion.com:2199/tunein/priceless.pls",
    "lofi": "https://streaming.live365.com/a05149",
    "rock": "http://rockantenne.de/musikstream/stream",
    "pop hits": "http://rfcmedia2.streamguys1.com/MusicChoice/hit.aac",
    "country": "http://rfcmedia2.streamguys1.com/MusicChoice/country.aac",
    "hip hop": "http://rfcmedia2.streamguys1.com/MusicChoice/hiphop.aac",
}

_mpv_proc: subprocess.Popen | None = None
_lock = threading.Lock()


def _kill_ambient() -> None:
    global _mpv_proc
    with _lock:
        if _mpv_proc and _mpv_proc.poll() is None:
            _mpv_proc.terminate()
            try:
                _mpv_proc.wait(timeout=3)
            except subprocess.TimeoutExpired:
                _mpv_proc.kill()
            _mpv_proc = None


def _play_url(url: str) -> None:
    global _mpv_proc
    _kill_ambient()
    cmd = ["mpv", "--no-video", "--really-quiet", url]
    with _lock:
        _mpv_proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def _play_yt_query(query: str) -> None:
    global _mpv_proc
    _kill_ambient()
    cmd = ["mpv", "--no-video", "--really-quiet", f"ytdl://ytsearch1:{query}"]
    with _lock:
        _mpv_proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


@register("play_ambient")
def play_ambient(params: dict[str, Any], tts, response_hint: str = "") -> None:
    sound = params.get("sound", "rain").strip().lower()
    query = _AMBIENT_SOUNDS.get(sound, f"{sound} ambient sounds 1 hour")
    tts.speak(response_hint or f"Playing {sound} sounds.")
    threading.Thread(target=_play_yt_query, args=(query,), daemon=True).start()


@register("play_radio")
def play_radio(params: dict[str, Any], tts, response_hint: str = "") -> None:
    station = params.get("station", "").strip().lower()
    # Try exact match first
    url = _RADIO_STATIONS.get(station)
    if url:
        tts.speak(response_hint or f"Playing {station} radio.")
        threading.Thread(target=_play_url, args=(url,), daemon=True).start()
        return
    # Partial match
    for name, stream_url in _RADIO_STATIONS.items():
        if station in name or name in station:
            tts.speak(f"Playing {name}.")
            threading.Thread(target=_play_url, args=(stream_url,), daemon=True).start()
            return
    # Fallback: search YouTube
    tts.speak(f"Searching for {station} radio.")
    threading.Thread(target=_play_yt_query, args=(f"{station} radio live stream",), daemon=True).start()


@register("stop_ambient")
def stop_ambient(params: dict[str, Any], tts, response_hint: str = "") -> None:
    _kill_ambient()
    tts.speak(response_hint or "Stopped.")


@register("list_radio")
def list_radio(params: dict[str, Any], tts, response_hint: str = "") -> None:
    stations = ", ".join(_RADIO_STATIONS.keys())
    tts.speak(f"Available stations: {stations}.")
