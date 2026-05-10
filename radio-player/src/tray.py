from PyQt5.QtWidgets import QSystemTrayIcon, QMenu, QAction, QApplication
from PyQt5.QtGui import QIcon, QPixmap, QPainter, QColor, QFont
from PyQt5.QtCore import QSize, Qt, pyqtSignal, QObject


def _make_tray_icon() -> QIcon:
    """Generate a simple radio wave icon programmatically."""
    px = QPixmap(64, 64)
    px.fill(Qt.transparent)
    p = QPainter(px)
    p.setRenderHint(QPainter.Antialiasing)

    # Background circle
    p.setBrush(QColor("#e94560"))
    p.setPen(Qt.NoPen)
    p.drawEllipse(0, 0, 64, 64)

    # Radio text
    p.setPen(QColor("white"))
    f = QFont("Arial", 11, QFont.Bold)
    p.setFont(f)
    p.drawText(QSize(64, 64).width() // 2 - 10, 38, "📻")
    p.end()
    return QIcon(px)


class SystemTray(QObject):
    show_window = pyqtSignal()
    play_stop_toggled = pyqtSignal()
    quit_requested = pyqtSignal()

    def __init__(self, app_icon: QIcon = None, parent=None):
        super().__init__(parent)
        icon = app_icon or _make_tray_icon()
        self._tray = QSystemTrayIcon(icon, parent)
        self._tray.setToolTip("Radio Player")
        self._is_playing = False

        menu = QMenu()

        self._np_action = QAction("Not playing", menu)
        self._np_action.setEnabled(False)
        menu.addAction(self._np_action)
        menu.addSeparator()

        self._show_action = QAction("Show Window", menu)
        self._show_action.triggered.connect(self.show_window.emit)
        menu.addAction(self._show_action)

        self._play_action = QAction("▶  Play / Stop", menu)
        self._play_action.triggered.connect(self.play_stop_toggled.emit)
        menu.addAction(self._play_action)

        menu.addSeparator()

        quit_action = QAction("Quit", menu)
        quit_action.triggered.connect(self.quit_requested.emit)
        menu.addAction(quit_action)

        self._tray.setContextMenu(menu)
        self._tray.activated.connect(self._on_activated)

    def show(self):
        self._tray.show()

    def hide(self):
        self._tray.hide()

    def is_visible(self) -> bool:
        return self._tray.isVisible()

    def update_now_playing(self, station_name: str, is_playing: bool):
        self._is_playing = is_playing
        if is_playing and station_name:
            self._np_action.setText(f"▶  {station_name}")
            self._tray.setToolTip(f"Radio Player — {station_name}")
        else:
            self._np_action.setText("Not playing")
            self._tray.setToolTip("Radio Player")
        self._play_action.setText("⏸  Pause" if is_playing else "▶  Play")

    def show_message(self, title: str, message: str):
        self._tray.showMessage(title, message, QSystemTrayIcon.Information, 2000)

    def _on_activated(self, reason):
        if reason in (QSystemTrayIcon.Trigger, QSystemTrayIcon.DoubleClick):
            self.show_window.emit()
