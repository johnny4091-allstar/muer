import os
from PyQt5.QtWidgets import (
    QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, QSplitter,
    QTabWidget, QListWidget, QListWidgetItem, QLabel, QPushButton,
    QLineEdit, QSlider, QComboBox, QSizePolicy, QStatusBar,
    QAction, QMenuBar, QMenu, QApplication, QMessageBox,
)
from PyQt5.QtCore import Qt, QTimer, QSize, pyqtSlot
from PyQt5.QtGui import QIcon, QPixmap, QFont, QColor

from .api import RadioBrowserAPI, ApiWorker
from .player import RadioPlayer
from .favorites import FavoritesManager
from .station_list import StationListWidget
from .sleep_timer import SleepTimer, SleepTimerDialog
from .equalizer import EqualizerDialog
from .tray import SystemTray


ASSETS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "assets")


def _load_pixmap(name: str, size: int = 48) -> QPixmap:
    path = os.path.join(ASSETS_DIR, name)
    px = QPixmap(path)
    if px.isNull():
        px = QPixmap(size, size)
        px.fill(QColor("#2a2a4a"))
    return px.scaled(size, size, Qt.KeepAspectRatio, Qt.SmoothTransformation)


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Radio Player")
        self.setMinimumSize(960, 640)
        self.resize(1200, 720)

        self._api = RadioBrowserAPI()
        self._player = RadioPlayer(self)
        self._favorites = FavoritesManager()
        self._sleep_timer = SleepTimer(self)
        self._current_station: dict = {}
        self._current_worker: ApiWorker = None
        self._current_bands = [0.0] * 10
        self._search_debounce = QTimer(self)
        self._search_debounce.setSingleShot(True)
        self._search_debounce.setInterval(450)
        self._search_debounce.timeout.connect(self._do_search)
        self._anim_timer = QTimer(self)
        self._anim_timer.setInterval(200)
        self._anim_timer.timeout.connect(self._anim_tick)
        self._anim_timer.start()
        self._loading_dots = 0

        self._build_ui()
        self._build_menu()
        self._connect_signals()

        self._tray = SystemTray(parent=self)
        self._tray.show()
        self._tray.show_window.connect(self._restore_window)
        self._tray.play_stop_toggled.connect(self._on_play_pause)
        self._tray.quit_requested.connect(QApplication.quit)

        QTimer.singleShot(300, self._load_top_stations)
        QTimer.singleShot(800, self._load_sidebar_data)

    # ── UI Construction ──────────────────────────────────────────

    def _build_ui(self):
        central = QWidget()
        self.setCentralWidget(central)
        root_layout = QVBoxLayout(central)
        root_layout.setContentsMargins(0, 0, 0, 0)
        root_layout.setSpacing(0)

        root_layout.addWidget(self._build_top_bar())

        splitter = QSplitter(Qt.Horizontal)
        splitter.setHandleWidth(1)
        splitter.addWidget(self._build_sidebar())
        splitter.addWidget(self._build_main_panel())
        splitter.setSizes([220, 980])
        splitter.setStretchFactor(0, 0)
        splitter.setStretchFactor(1, 1)
        root_layout.addWidget(splitter, stretch=1)

        root_layout.addWidget(self._build_bottom_bar())

        status = QStatusBar()
        status.setFixedHeight(24)
        self.setStatusBar(status)
        self._status_bar = status

    def _build_top_bar(self) -> QWidget:
        bar = QWidget()
        bar.setObjectName("topBar")
        bar.setFixedHeight(56)
        layout = QHBoxLayout(bar)
        layout.setContentsMargins(16, 0, 16, 0)
        layout.setSpacing(12)

        title_lbl = QLabel("📻 Radio Player")
        title_lbl.setObjectName("appTitle")
        layout.addWidget(title_lbl)
        layout.addSpacing(16)

        self._search_box = QLineEdit()
        self._search_box.setPlaceholderText("Search stations…")
        self._search_box.setFixedWidth(320)
        self._search_box.setClearButtonEnabled(True)
        layout.addWidget(self._search_box)

        self._refresh_btn = QPushButton("⟳")
        self._refresh_btn.setObjectName("iconBtn")
        self._refresh_btn.setToolTip("Refresh top stations")
        layout.addWidget(self._refresh_btn)

        self._loading_lbl = QLabel()
        self._loading_lbl.setFixedWidth(80)
        self._loading_lbl.setStyleSheet("color: #8888aa; font-size: 11px;")
        layout.addWidget(self._loading_lbl)

        layout.addStretch()
        return bar

    def _build_sidebar(self) -> QWidget:
        sidebar = QWidget()
        sidebar.setObjectName("sidebar")
        sidebar.setFixedWidth(220)
        layout = QVBoxLayout(sidebar)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(0)

        self._sidebar_tabs = QTabWidget()
        self._sidebar_tabs.setDocumentMode(True)

        # ─ Browse tab
        browse_widget = QWidget()
        browse_layout = QVBoxLayout(browse_widget)
        browse_layout.setContentsMargins(0, 8, 0, 0)
        browse_layout.setSpacing(4)

        browse_lbl = QLabel("  Countries")
        browse_lbl.setStyleSheet("color: #5a5a7a; font-size: 10px; font-weight: bold; padding: 4px 12px;")
        browse_layout.addWidget(browse_lbl)

        self._country_list = QListWidget()
        self._country_list.setObjectName("sideList")
        self._country_list.addItem("Loading…")
        browse_layout.addWidget(self._country_list)

        genre_lbl = QLabel("  Genres")
        genre_lbl.setStyleSheet("color: #5a5a7a; font-size: 10px; font-weight: bold; padding: 4px 12px;")
        browse_layout.addWidget(genre_lbl)

        self._genre_list = QListWidget()
        self._genre_list.setObjectName("sideList")
        self._genre_list.addItem("Loading…")
        browse_layout.addWidget(self._genre_list)

        self._sidebar_tabs.addTab(browse_widget, "Browse")

        # ─ Favorites tab
        fav_widget = QWidget()
        fav_layout = QVBoxLayout(fav_widget)
        fav_layout.setContentsMargins(0, 8, 0, 0)
        self._fav_sidebar_list = QListWidget()
        self._fav_sidebar_list.setObjectName("sideList")
        fav_layout.addWidget(self._fav_sidebar_list)
        self._sidebar_tabs.addTab(fav_widget, "Favorites")

        layout.addWidget(self._sidebar_tabs)
        return sidebar

    def _build_main_panel(self) -> QWidget:
        panel = QWidget()
        panel.setObjectName("mainPanel")
        layout = QVBoxLayout(panel)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(0)

        # Section header
        header = QWidget()
        header.setObjectName("sectionHeader")
        header.setFixedHeight(40)
        h_layout = QHBoxLayout(header)
        h_layout.setContentsMargins(16, 0, 16, 0)
        self._section_lbl = QLabel("Top Stations")
        self._section_lbl.setObjectName("sectionTitle")
        h_layout.addWidget(self._section_lbl)
        h_layout.addStretch()
        self._count_lbl = QLabel("")
        self._count_lbl.setStyleSheet("color: #5a5a7a; font-size: 11px;")
        h_layout.addWidget(self._count_lbl)
        layout.addWidget(header)

        self._station_list = StationListWidget()
        layout.addWidget(self._station_list)
        return panel

    def _build_bottom_bar(self) -> QWidget:
        bar = QWidget()
        bar.setObjectName("bottomBar")
        bar.setFixedHeight(90)
        layout = QHBoxLayout(bar)
        layout.setContentsMargins(16, 0, 16, 0)
        layout.setSpacing(0)

        # ─ Now Playing (left third)
        np_widget = QWidget()
        np_widget.setObjectName("nowPlaying")
        np_widget.setFixedWidth(340)
        np_layout = QHBoxLayout(np_widget)
        np_layout.setContentsMargins(0, 0, 16, 0)
        np_layout.setSpacing(12)

        self._np_favicon = QLabel()
        self._np_favicon.setFixedSize(56, 56)
        self._np_favicon.setStyleSheet("border-radius: 8px; background: #1a1a3e;")
        self._np_favicon.setAlignment(Qt.AlignCenter)
        self._np_favicon.setText("📻")
        self._np_favicon.setScaledContents(False)
        np_layout.addWidget(self._np_favicon)

        np_text = QWidget()
        np_text_layout = QVBoxLayout(np_text)
        np_text_layout.setContentsMargins(0, 0, 0, 0)
        np_text_layout.setSpacing(2)

        self._np_name = QLabel("Not playing")
        self._np_name.setObjectName("stationName")
        self._np_name.setMaximumWidth(240)
        np_text_layout.addWidget(self._np_name)

        self._np_meta = QLabel("")
        self._np_meta.setObjectName("metaLabel")
        self._np_meta.setMaximumWidth(240)
        np_text_layout.addWidget(self._np_meta)

        self._np_stream = QLabel("")
        self._np_stream.setObjectName("metaLabel")
        self._np_stream.setMaximumWidth(240)
        np_text_layout.addWidget(self._np_stream)

        self._timer_lbl = QLabel("")
        self._timer_lbl.setObjectName("timerLabel")
        np_text_layout.addWidget(self._timer_lbl)
        np_layout.addWidget(np_text)
        layout.addWidget(np_widget)

        layout.addStretch()

        # ─ Playback controls (center)
        ctrl_widget = QWidget()
        ctrl_widget.setObjectName("controls")
        ctrl_layout = QHBoxLayout(ctrl_widget)
        ctrl_layout.setContentsMargins(0, 0, 0, 0)
        ctrl_layout.setSpacing(8)

        self._stop_btn = QPushButton("⏹")
        self._stop_btn.setObjectName("iconBtn")
        self._stop_btn.setToolTip("Stop")

        self._play_btn = QPushButton("▶")
        self._play_btn.setObjectName("playBtn")
        self._play_btn.setToolTip("Play / Pause")

        self._fav_btn = QPushButton("♡")
        self._fav_btn.setObjectName("favBtn")
        self._fav_btn.setCheckable(True)
        self._fav_btn.setToolTip("Toggle Favorite")

        ctrl_layout.addWidget(self._stop_btn)
        ctrl_layout.addWidget(self._play_btn)
        ctrl_layout.addWidget(self._fav_btn)
        layout.addWidget(ctrl_widget)

        layout.addStretch()

        # ─ Volume + tools (right)
        right_widget = QWidget()
        right_widget.setFixedWidth(300)
        right_layout = QHBoxLayout(right_widget)
        right_layout.setContentsMargins(16, 0, 0, 0)
        right_layout.setSpacing(8)

        self._eq_btn = QPushButton("EQ")
        self._eq_btn.setObjectName("iconBtn")
        self._eq_btn.setToolTip("Equalizer")
        self._eq_btn.setFixedWidth(40)

        self._sleep_btn = QPushButton("⏰")
        self._sleep_btn.setObjectName("iconBtn")
        self._sleep_btn.setToolTip("Sleep Timer")

        vol_icon = QLabel("🔊")
        vol_icon.setStyleSheet("background: transparent; font-size: 16px;")

        self._vol_slider = QSlider(Qt.Horizontal)
        self._vol_slider.setRange(0, 100)
        self._vol_slider.setValue(80)
        self._vol_slider.setFixedWidth(120)
        self._vol_slider.setToolTip("Volume")

        self._vol_lbl = QLabel("80%")
        self._vol_lbl.setFixedWidth(36)
        self._vol_lbl.setStyleSheet("color: #8888aa; font-size: 11px;")

        right_layout.addWidget(self._eq_btn)
        right_layout.addWidget(self._sleep_btn)
        right_layout.addSpacing(8)
        right_layout.addWidget(vol_icon)
        right_layout.addWidget(self._vol_slider)
        right_layout.addWidget(self._vol_lbl)
        layout.addWidget(right_widget)

        return bar

    # ── Menu Bar ─────────────────────────────────────────────────

    def _build_menu(self):
        mb = self.menuBar()

        file_menu = mb.addMenu("File")
        quit_act = QAction("Quit", self)
        quit_act.setShortcut("Ctrl+Q")
        quit_act.triggered.connect(QApplication.quit)
        file_menu.addAction(quit_act)

        tools_menu = mb.addMenu("Tools")
        eq_act = QAction("Equalizer…", self)
        eq_act.setShortcut("Ctrl+E")
        eq_act.triggered.connect(self._open_equalizer)
        tools_menu.addAction(eq_act)

        timer_act = QAction("Sleep Timer…", self)
        timer_act.triggered.connect(self._open_sleep_timer)
        tools_menu.addAction(timer_act)

        help_menu = mb.addMenu("Help")
        about_act = QAction("About", self)
        about_act.triggered.connect(self._show_about)
        help_menu.addAction(about_act)

    # ── Signal Wiring ────────────────────────────────────────────

    def _connect_signals(self):
        # Search
        self._search_box.textChanged.connect(lambda _: self._search_debounce.start())
        self._search_box.returnPressed.connect(self._do_search)
        self._refresh_btn.clicked.connect(self._load_top_stations)

        # Station list
        self._station_list.play_requested.connect(self._play_station)
        self._station_list.favorite_toggled.connect(self._toggle_favorite)
        self._station_list.url_copied.connect(lambda u: self._status("URL copied to clipboard"))

        # Sidebar navigation
        self._country_list.itemClicked.connect(self._on_country_clicked)
        self._genre_list.itemClicked.connect(self._on_genre_clicked)
        self._fav_sidebar_list.itemDoubleClicked.connect(self._on_fav_sidebar_click)
        self._sidebar_tabs.currentChanged.connect(self._on_sidebar_tab_changed)

        # Playback controls
        self._play_btn.clicked.connect(self._on_play_pause)
        self._stop_btn.clicked.connect(self._on_stop)
        self._fav_btn.clicked.connect(self._on_fav_btn)
        self._vol_slider.valueChanged.connect(self._on_volume)
        self._eq_btn.clicked.connect(self._open_equalizer)
        self._sleep_btn.clicked.connect(self._open_sleep_timer)

        # Player events
        self._player.stateChanged.connect(self._on_player_state)
        self._player.metadataChanged.connect(self._on_metadata)

        # Sleep timer
        self._sleep_timer.timer_expired.connect(self._on_sleep_expired)
        self._sleep_timer.tick.connect(self._on_timer_tick)

    # ── API Loading ──────────────────────────────────────────────

    def _load_top_stations(self):
        self._section_lbl.setText("Top Stations")
        self._fetch_stations("top_stations", limit=100)

    def _do_search(self):
        query = self._search_box.text().strip()
        if not query:
            self._load_top_stations()
            return
        self._section_lbl.setText(f'Search: "{query}"')
        self._fetch_stations("search", query=query)

    def _fetch_stations(self, method: str, **kwargs):
        if self._current_worker and self._current_worker.isRunning():
            self._current_worker.quit()

        self._loading_lbl.setText("Loading…")
        worker = ApiWorker(self._api, method, **kwargs)
        worker.result.connect(self._on_stations_loaded)
        worker.error.connect(self._on_api_error)
        worker.finished.connect(lambda: self._loading_lbl.setText(""))
        self._current_worker = worker
        worker.start()

    def _load_sidebar_data(self):
        countries_worker = ApiWorker(self._api, "list_countries")
        countries_worker.result.connect(self._on_countries_loaded)
        countries_worker.start()

        tags_worker = ApiWorker(self._api, "list_tags")
        tags_worker.result.connect(self._on_tags_loaded)
        tags_worker.start()

    @pyqtSlot(list)
    def _on_stations_loaded(self, stations: list):
        self._station_list.load_stations(stations)
        self._station_list.set_favorites({f["stationuuid"] for f in self._favorites.all()})
        if self._current_station:
            self._station_list.set_playing(self._current_station.get("stationuuid", ""))
        self._count_lbl.setText(f"{len(stations)} stations")

    @pyqtSlot(str)
    def _on_api_error(self, error: str):
        self._status(f"API error: {error}")

    @pyqtSlot(list)
    def _on_countries_loaded(self, countries: list):
        self._country_list.clear()
        for c in countries:
            name = c.get("name", "")
            count = c.get("stationcount", 0)
            item = QListWidgetItem(f"  {name}  ({count})")
            item.setData(Qt.UserRole, name)
            self._country_list.addItem(item)

    @pyqtSlot(list)
    def _on_tags_loaded(self, tags: list):
        self._genre_list.clear()
        for t in tags:
            name = t.get("name", "").title()
            count = t.get("stationcount", 0)
            item = QListWidgetItem(f"  {name}  ({count})")
            item.setData(Qt.UserRole, t.get("name", ""))
            self._genre_list.addItem(item)

    # ── Sidebar Events ───────────────────────────────────────────

    def _on_country_clicked(self, item: QListWidgetItem):
        country = item.data(Qt.UserRole)
        if country:
            self._section_lbl.setText(f"Country: {country}")
            self._fetch_stations("stations_by_country", country=country)

    def _on_genre_clicked(self, item: QListWidgetItem):
        tag = item.data(Qt.UserRole)
        if tag:
            self._section_lbl.setText(f"Genre: {tag.title()}")
            self._fetch_stations("stations_by_tag", tag=tag)

    def _on_sidebar_tab_changed(self, index: int):
        if index == 1:
            self._refresh_fav_sidebar()

    def _refresh_fav_sidebar(self):
        self._fav_sidebar_list.clear()
        for st in self._favorites.all():
            item = QListWidgetItem(f"  {st.get('name', 'Unknown')}")
            item.setData(Qt.UserRole, st)
            self._fav_sidebar_list.addItem(item)

    def _on_fav_sidebar_click(self, item: QListWidgetItem):
        st = item.data(Qt.UserRole)
        if st:
            self._play_station(st)

    # ── Playback ─────────────────────────────────────────────────

    def _play_station(self, station: dict):
        url = station.get("url_resolved") or station.get("url", "")
        if not url:
            self._status("No stream URL available")
            return
        self._current_station = station
        self._player.play(url)
        self._update_now_playing(station)
        self._station_list.set_playing(station.get("stationuuid", ""))
        self._fav_btn.setChecked(self._favorites.is_favorite(station.get("stationuuid", "")))

    def _update_now_playing(self, station: dict):
        name = station.get("name", "Unknown").strip()
        country = station.get("country", "")
        tags = station.get("tags", "")
        genre = tags.split(",")[0].strip().title() if tags else ""
        codec = station.get("codec", "")
        bitrate = station.get("bitrate", 0)

        self._np_name.setText(name)
        meta_parts = [p for p in [country, genre] if p]
        self._np_meta.setText("  ·  ".join(meta_parts))
        stream_parts = [p for p in [codec, f"{bitrate}kbps" if bitrate else ""] if p]
        self._np_stream.setText("  ·  ".join(stream_parts))

        favicon_url = station.get("favicon", "")
        if favicon_url:
            from .api import FaviconWorker
            w = FaviconWorker(favicon_url)
            w.loaded.connect(self._on_np_favicon)
            w.start()
            self._np_favicon_worker = w
        else:
            self._np_favicon.setText("📻")
            self._np_favicon.setPixmap(QPixmap())

        self.setWindowTitle(f"Radio Player — {name}")
        self._tray.update_now_playing(name, True)

    def _on_np_favicon(self, url: str, data: bytes):
        px = QPixmap()
        px.loadFromData(data)
        if not px.isNull():
            px = px.scaled(56, 56, Qt.KeepAspectRatio, Qt.SmoothTransformation)
            self._np_favicon.setPixmap(px)
            self._np_favicon.setText("")

    def _on_play_pause(self):
        if not self._current_station:
            return
        if self._player.is_playing():
            self._player.toggle_pause()
        else:
            url = self._current_station.get("url_resolved") or self._current_station.get("url", "")
            if url:
                self._player.play(url)

    def _on_stop(self):
        self._player.stop()
        self._play_btn.setText("▶")
        self._np_name.setText("Not playing")
        self._np_meta.setText("")
        self._np_stream.setText("")
        self._np_favicon.setText("📻")
        self._np_favicon.setPixmap(QPixmap())
        self.setWindowTitle("Radio Player")
        self._station_list.set_playing("")
        self._tray.update_now_playing("", False)

    def _on_player_state(self, state: str):
        if state == "playing":
            self._play_btn.setText("⏸")
            self._status(f"Playing: {self._current_station.get('name', '')}")
        elif state in ("stopped", "paused"):
            self._play_btn.setText("▶")
        elif state == "buffering":
            self._play_btn.setText("⏳")
            self._status("Buffering…")
        elif state == "error":
            self._play_btn.setText("▶")
            self._status("Stream error — try another station")

    def _on_metadata(self, title: str, artist: str):
        if title:
            self._np_meta.setText(title)

    # ── Favorites ────────────────────────────────────────────────

    def _toggle_favorite(self, station: dict):
        is_now_fav = self._favorites.toggle(station)
        self._station_list.set_favorites({f["stationuuid"] for f in self._favorites.all()})
        if station.get("stationuuid") == self._current_station.get("stationuuid"):
            self._fav_btn.setChecked(is_now_fav)
        msg = "Added to Favorites" if is_now_fav else "Removed from Favorites"
        self._status(msg)
        if self._sidebar_tabs.currentIndex() == 1:
            self._refresh_fav_sidebar()

    def _on_fav_btn(self):
        if self._current_station:
            self._toggle_favorite(self._current_station)

    # ── Volume ───────────────────────────────────────────────────

    def _on_volume(self, value: int):
        self._player.set_volume(value)
        self._vol_lbl.setText(f"{value}%")
        if value == 0:
            icon = "🔇"
        elif value < 40:
            icon = "🔈"
        elif value < 70:
            icon = "🔉"
        else:
            icon = "🔊"

    # ── Sleep Timer ──────────────────────────────────────────────

    def _open_sleep_timer(self):
        current = self._sleep_timer.remaining_seconds() // 60 if self._sleep_timer.is_active() else 0
        dlg = SleepTimerDialog(current_minutes=current, parent=self)
        result = dlg.exec_()
        if result == 1:  # Accepted = set timer
            self._sleep_timer.start(dlg.selected_minutes())
            self._status(f"Sleep timer set for {dlg.selected_minutes()} minutes")
        elif result == 2:  # Disabled
            self._sleep_timer.cancel()
            self._timer_lbl.setText("")
            self._status("Sleep timer cancelled")

    def _on_sleep_expired(self):
        self._player.stop()
        self._play_btn.setText("▶")
        self._timer_lbl.setText("")
        self._status("Sleep timer: playback stopped")

    def _on_timer_tick(self, remaining: int):
        if remaining > 0:
            m, s = divmod(remaining, 60)
            self._timer_lbl.setText(f"⏰ {m:02d}:{s:02d}")
        else:
            self._timer_lbl.setText("")

    # ── Equalizer ────────────────────────────────────────────────

    def _open_equalizer(self):
        dlg = EqualizerDialog(current_bands=self._current_bands, parent=self)
        dlg.eq_applied.connect(self._on_eq_applied)
        dlg.exec_()

    def _on_eq_applied(self, bands: list):
        self._current_bands = bands
        self._player.apply_equalizer(bands)
        self._status("Equalizer applied")

    # ── Animation ────────────────────────────────────────────────

    def _anim_tick(self):
        if self._player.is_playing():
            self._station_list.anim_tick()

    # ── System Tray / Close ──────────────────────────────────────

    def closeEvent(self, event):
        if self._tray.is_visible():
            event.ignore()
            self.hide()
            self._tray.show_message("Radio Player", "Minimized to system tray")
        else:
            event.accept()

    def _restore_window(self):
        self.showNormal()
        self.raise_()
        self.activateWindow()

    # ── Helpers ──────────────────────────────────────────────────

    def _status(self, message: str):
        self._status_bar.showMessage(message, 4000)

    def _show_about(self):
        QMessageBox.about(
            self,
            "About Radio Player",
            "<h3>Radio Player</h3>"
            "<p>A beautiful desktop internet radio player for Ubuntu Linux.</p>"
            "<p>Powered by <b>radio-browser.info</b> — 30,000+ stations worldwide.</p>"
            "<p>Built with PyQt5 + VLC.</p>",
        )
