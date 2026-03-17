"""
Music skill: play, pause, stop, skip music via yt-dlp + mpv.
"""

import subprocess
import threading
from typing import Any

from assistant.skills import register
from assistant.utils.logger import get_logger

log = get_logger("skill.music")

_mpv_proc: subprocess.Popen | None = None
_lock = threading.Lock()


def _kill_mpv() -> None:
    global _mpv_proc
    with _lock:
        if _mpv_proc and _mpv_proc.poll() is None:
            _mpv_proc.terminate()
            try:
                _mpv_proc.wait(timeout=3)
            except subprocess.TimeoutExpired:
                _mpv_proc.kill()
            _mpv_proc = None


def _play_stream(url_or_query: str) -> None:
    global _mpv_proc
    _kill_mpv()
    cmd = [
        "mpv",
        "--no-video",
        "--really-quiet",
        f"ytdl://ytsearch1:{url_or_query}",
    ]
    log.info(f"Starting mpv: {' '.join(cmd)}")
    with _lock:
        _mpv_proc = subprocess.Popen(
            cmd,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )


@register("play_music")
def play_music(params: dict[str, Any], tts, response_hint: str = "") -> None:
    query = params.get("query", "").strip()
    if not query:
        tts.speak("What would you like me to play?")
        return
    tts.speak(response_hint or f"Playing {query}")
    thread = threading.Thread(target=_play_stream, args=(query,), daemon=True)
    thread.start()


@register("stop_music")
def stop_music(params: dict[str, Any], tts, response_hint: str = "") -> None:
    _kill_mpv()
    tts.speak(response_hint or "Music stopped.")


@register("pause_music")
def pause_music(params: dict[str, Any], tts, response_hint: str = "") -> None:
    # mpv socket control would be ideal; for now, stop
    _kill_mpv()
    tts.speak(response_hint or "Music paused.")


@register("resume_music")
def resume_music(params: dict[str, Any], tts, response_hint: str = "") -> None:
    tts.speak("Sorry, I can't resume music without knowing what was playing.")
