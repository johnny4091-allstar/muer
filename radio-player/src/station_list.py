from PyQt5.QtWidgets import (
    QListWidget, QListWidgetItem, QStyledItemDelegate,
    QApplication, QStyle, QMenu, QAction,
)
from PyQt5.QtCore import Qt, QSize, QRect, QPoint, pyqtSignal
from PyQt5.QtGui import (
    QPainter, QColor, QPixmap, QFont, QPainterPath,
    QFontMetrics, QBrush,
)

from .api import FaviconWorker

ITEM_H = 76
FAVICON_SIZE = 48
PADDING = 10


class StationItemDelegate(QStyledItemDelegate):
    def __init__(self, parent=None):
        super().__init__(parent)
        self._playing_uuid = ""
        self._anim_step = 0
        self._favorite_uuids: set[str] = set()

    def set_playing(self, uuid: str):
        self._playing_uuid = uuid

    def set_favorites(self, uuids: set[str]):
        self._favorite_uuids = uuids

    def anim_tick(self):
        self._anim_step = (self._anim_step + 1) % 8

    def sizeHint(self, option, index):
        return QSize(option.rect.width(), ITEM_H)

    def paint(self, painter: QPainter, option, index):
        station: dict = index.data(Qt.UserRole)
        if not station:
            return

        painter.save()
        painter.setRenderHint(QPainter.Antialiasing)

        rect = option.rect
        uuid = station.get("stationuuid", "")
        is_playing = uuid == self._playing_uuid
        is_selected = bool(option.state & QStyle.State_Selected)
        is_hovered = bool(option.state & QStyle.State_MouseOver)

        # Background
        if is_playing:
            bg = QColor("#0f2a50")
        elif is_selected:
            bg = QColor("#0f3460")
        elif is_hovered:
            bg = QColor("#1e2a50")
        else:
            bg = QColor("#16213e")
        painter.fillRect(rect, bg)

        # Left accent bar for playing station
        if is_playing:
            painter.fillRect(QRect(rect.x(), rect.y(), 3, rect.height()), QColor("#e94560"))

        # Favicon
        fav_pixmap: QPixmap = index.data(Qt.DecorationRole)
        fx = rect.x() + PADDING + (4 if is_playing else 0)
        fy = rect.y() + (ITEM_H - FAVICON_SIZE) // 2

        if fav_pixmap and not fav_pixmap.isNull():
            scaled = fav_pixmap.scaled(FAVICON_SIZE, FAVICON_SIZE, Qt.KeepAspectRatio, Qt.SmoothTransformation)
            # Clip to rounded rect
            path = QPainterPath()
            path.addRoundedRect(fx, fy, FAVICON_SIZE, FAVICON_SIZE, 8, 8)
            painter.setClipPath(path)
            painter.drawPixmap(fx, fy, FAVICON_SIZE, FAVICON_SIZE, scaled)
            painter.setClipping(False)
        else:
            # Placeholder
            path = QPainterPath()
            path.addRoundedRect(fx, fy, FAVICON_SIZE, FAVICON_SIZE, 8, 8)
            painter.fillPath(path, QColor("#1a1a3e"))
            painter.setPen(QColor("#3a3a6a"))
            painter.setFont(QFont("monospace", 18))
            painter.drawText(QRect(fx, fy, FAVICON_SIZE, FAVICON_SIZE), Qt.AlignCenter, "📻")

        # Text area
        tx = fx + FAVICON_SIZE + PADDING
        tw = rect.right() - tx - PADDING - 50  # leave space for bitrate badge

        name = station.get("name", "Unknown Station").strip()
        country = station.get("country", "")
        tags = station.get("tags", "")
        genre = (tags.split(",")[0].strip().title() if tags else "")
        codec = station.get("codec", "")
        bitrate = station.get("bitrate", 0)

        meta_parts = [p for p in [country, genre] if p]
        meta_str = "  ·  ".join(meta_parts) if meta_parts else ""

        # Station name
        name_font = QFont()
        name_font.setPointSize(11)
        name_font.setBold(is_playing)
        painter.setFont(name_font)
        painter.setPen(QColor("#e94560") if is_playing else QColor("#e0e0e0"))
        name_metrics = QFontMetrics(name_font)
        name_elided = name_metrics.elidedText(name, Qt.ElideRight, tw)
        painter.drawText(tx, rect.y() + 24, name_elided)

        # Meta line
        meta_font = QFont()
        meta_font.setPointSize(9)
        painter.setFont(meta_font)
        painter.setPen(QColor("#8888aa"))
        meta_metrics = QFontMetrics(meta_font)
        meta_elided = meta_metrics.elidedText(meta_str, Qt.ElideRight, tw)
        painter.drawText(tx, rect.y() + 42, meta_elided)

        # Playing indicator (animated dots)
        if is_playing:
            dot_x = tx
            dot_y = rect.y() + 56
            for d in range(3):
                phase = (self._anim_step + d * 2) % 8
                h = 4 + (4 if phase < 4 else 0)
                dot_rect = QRect(dot_x + d * 10, dot_y - h // 2, 6, h)
                painter.fillRect(dot_rect, QColor("#e94560"))

        # Bitrate / codec badge
        if bitrate and int(bitrate) > 0:
            badge_text = f"{bitrate}k"
            badge_font = QFont()
            badge_font.setPointSize(8)
            painter.setFont(badge_font)
            bm = QFontMetrics(badge_font)
            bw = bm.horizontalAdvance(badge_text) + 10
            bh = 18
            bx = rect.right() - bw - 8
            by = rect.y() + (ITEM_H - bh) // 2
            badge_path = QPainterPath()
            badge_path.addRoundedRect(bx, by, bw, bh, 4, 4)
            painter.fillPath(badge_path, QColor("#2a2a4a"))
            painter.setPen(QColor("#6688aa"))
            painter.drawText(QRect(bx, by, bw, bh), Qt.AlignCenter, badge_text)

        # Separator line
        painter.setPen(QColor("#1e2a40"))
        painter.drawLine(rect.x() + PADDING, rect.bottom(), rect.right() - PADDING, rect.bottom())

        painter.restore()


class StationListWidget(QListWidget):
    play_requested = pyqtSignal(dict)
    favorite_toggled = pyqtSignal(dict)
    url_copied = pyqtSignal(str)

    def __init__(self, parent=None):
        super().__init__(parent)
        self._delegate = StationItemDelegate(self)
        self.setItemDelegate(self._delegate)
        self.setMouseTracking(True)
        self.setHorizontalScrollBarPolicy(Qt.ScrollBarAlwaysOff)
        self.setSpacing(0)
        self.setUniformItemSizes(True)

        self._favicon_cache: dict[str, QPixmap] = {}
        self._favicon_workers: dict[str, FaviconWorker] = {}

        self._anim_timer_running = False

        self.itemDoubleClicked.connect(self._on_double_click)
        self.setContextMenuPolicy(Qt.CustomContextMenu)
        self.customContextMenuRequested.connect(self._on_context_menu)

    def load_stations(self, stations: list[dict]):
        self.clear()
        for st in stations:
            item = QListWidgetItem()
            item.setData(Qt.UserRole, st)
            item.setSizeHint(QSize(self.width(), ITEM_H))

            # Check favicon cache
            favicon_url = st.get("favicon", "")
            if favicon_url and favicon_url in self._favicon_cache:
                item.setData(Qt.DecorationRole, self._favicon_cache[favicon_url])
            elif favicon_url:
                self._queue_favicon(favicon_url)

            self.addItem(item)

    def _queue_favicon(self, url: str):
        if url in self._favicon_workers:
            return
        worker = FaviconWorker(url)
        worker.loaded.connect(self._on_favicon_loaded)
        worker.finished.connect(lambda: self._favicon_workers.pop(url, None))
        self._favicon_workers[url] = worker
        worker.start()

    def _on_favicon_loaded(self, url: str, data: bytes):
        pixmap = QPixmap()
        pixmap.loadFromData(data)
        if not pixmap.isNull():
            self._favicon_cache[url] = pixmap
            # Update all items using this URL
            for i in range(self.count()):
                item = self.item(i)
                st = item.data(Qt.UserRole)
                if st and st.get("favicon") == url:
                    item.setData(Qt.DecorationRole, pixmap)
            self.viewport().update()

    def set_playing(self, uuid: str):
        self._delegate.set_playing(uuid)
        self.viewport().update()

    def set_favorites(self, uuids: set[str]):
        self._delegate.set_favorites(uuids)
        self.viewport().update()

    def anim_tick(self):
        self._delegate.anim_tick()
        self.viewport().update()

    def current_station(self) -> dict | None:
        item = self.currentItem()
        if item:
            return item.data(Qt.UserRole)
        return None

    def _on_double_click(self, item: QListWidgetItem):
        st = item.data(Qt.UserRole)
        if st:
            self.play_requested.emit(st)

    def _on_context_menu(self, pos: QPoint):
        item = self.itemAt(pos)
        if not item:
            return
        st = item.data(Qt.UserRole)
        if not st:
            return

        menu = QMenu(self)
        act_play = QAction("▶  Play", self)
        act_fav = QAction("♥  Toggle Favorite", self)
        act_copy = QAction("⎘  Copy Stream URL", self)

        act_play.triggered.connect(lambda: self.play_requested.emit(st))
        act_fav.triggered.connect(lambda: self.favorite_toggled.emit(st))
        act_copy.triggered.connect(lambda: self._copy_url(st))

        menu.addAction(act_play)
        menu.addSeparator()
        menu.addAction(act_fav)
        menu.addAction(act_copy)
        menu.exec_(self.mapToGlobal(pos))

    def _copy_url(self, st: dict):
        url = st.get("url_resolved", st.get("url", ""))
        if url:
            QApplication.clipboard().setText(url)
            self.url_copied.emit(url)
