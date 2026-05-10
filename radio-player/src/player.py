import vlc
from PyQt5.QtCore import QObject, QTimer, pyqtSignal

EQ_PRESETS = {
    "Flat":         [0.0] * 10,
    "Bass Boost":   [8.0, 6.0, 4.0, 2.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    "Treble Boost": [0.0, 0.0, 0.0, 0.0, 0.0, 2.0, 4.0, 6.0, 8.0, 8.0],
    "Rock":         [5.0, 4.0, 2.0, 0.0, -1.0, -1.0, 2.0, 4.0, 5.0, 5.0],
    "Pop":          [-1.0, 0.0, 2.0, 3.0, 4.0, 3.0, 2.0, 0.0, -1.0, -1.0],
    "Classical":    [4.0, 3.0, 2.0, 1.0, 0.0, 0.0, -1.0, -2.0, -3.0, -3.0],
    "Jazz":         [3.0, 2.0, 0.0, 2.0, 4.0, 4.0, 3.0, 2.0, 1.0, 0.0],
    "Electronic":   [6.0, 5.0, 0.0, -2.0, -2.0, 2.0, 4.0, 5.0, 6.0, 6.0],
}

EQ_BANDS = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000]


class RadioPlayer(QObject):
    stateChanged = pyqtSignal(str)          # 'playing' | 'paused' | 'stopped' | 'buffering' | 'error'
    metadataChanged = pyqtSignal(str, str)  # now_playing_title, artist

    def __init__(self, parent=None):
        super().__init__(parent)
        self._instance = vlc.Instance("--no-video", "--quiet", "--no-xlib")
        self._media_player = self._instance.media_player_new()
        self._eq = None
        self._current_url = ""
        self._volume = 80

        em = self._media_player.event_manager()
        em.event_attach(vlc.EventType.MediaPlayerPlaying, self._vlc_playing)
        em.event_attach(vlc.EventType.MediaPlayerStopped, self._vlc_stopped)
        em.event_attach(vlc.EventType.MediaPlayerPaused, self._vlc_paused)
        em.event_attach(vlc.EventType.MediaPlayerEncounteredError, self._vlc_error)
        em.event_attach(vlc.EventType.MediaPlayerBuffering, self._vlc_buffering)

        self._meta_timer = QTimer(self)
        self._meta_timer.setInterval(3000)
        self._meta_timer.timeout.connect(self._poll_metadata)

        self._last_title = ""

    # ── Public API ───────────────────────────────────────────────

    def play(self, url: str):
        self._current_url = url
        media = self._instance.media_new(url)
        self._media_player.set_media(media)
        self._media_player.audio_set_volume(self._volume)
        if self._eq:
            self._media_player.set_equalizer(self._eq)
        self._media_player.play()
        self._meta_timer.start()

    def stop(self):
        self._meta_timer.stop()
        self._media_player.stop()
        self._last_title = ""

    def toggle_pause(self):
        if self._media_player.is_playing():
            self._media_player.pause()
        else:
            self._media_player.play()

    def is_playing(self) -> bool:
        return bool(self._media_player.is_playing())

    def set_volume(self, volume: int):
        self._volume = max(0, min(100, volume))
        self._media_player.audio_set_volume(self._volume)

    def get_volume(self) -> int:
        return self._volume

    def apply_equalizer(self, bands: list[float]):
        eq = self._instance.audio_equalizer_new()
        for i, amp in enumerate(bands[:10]):
            vlc.libvlc_audio_equalizer_set_amp_at_index(eq, float(amp), i)
        self._eq = eq
        self._media_player.set_equalizer(eq)

    def apply_preset(self, preset_name: str):
        bands = EQ_PRESETS.get(preset_name, EQ_PRESETS["Flat"])
        self.apply_equalizer(bands)

    def current_url(self) -> str:
        return self._current_url

    # ── VLC event callbacks (called from VLC thread) ─────────────

    def _vlc_playing(self, event):
        QTimer.singleShot(0, lambda: self.stateChanged.emit("playing"))

    def _vlc_stopped(self, event):
        QTimer.singleShot(0, lambda: self.stateChanged.emit("stopped"))

    def _vlc_paused(self, event):
        QTimer.singleShot(0, lambda: self.stateChanged.emit("paused"))

    def _vlc_error(self, event):
        QTimer.singleShot(0, lambda: self.stateChanged.emit("error"))

    def _vlc_buffering(self, event):
        QTimer.singleShot(0, lambda: self.stateChanged.emit("buffering"))

    # ── Metadata polling ─────────────────────────────────────────

    def _poll_metadata(self):
        media = self._media_player.get_media()
        if not media:
            return
        media.parse()
        title = media.get_meta(vlc.Meta.NowPlaying) or ""
        artist = media.get_meta(vlc.Meta.Artist) or ""
        if title and title != self._last_title:
            self._last_title = title
            QTimer.singleShot(0, lambda: self.metadataChanged.emit(title, artist))
