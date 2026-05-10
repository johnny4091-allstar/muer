DARK_STYLESHEET = """
/* ── Window & Containers ─────────────────────────────────────── */
QMainWindow, QDialog {
    background: #0d0d1a;
    color: #e0e0e0;
}
QWidget {
    background: transparent;
    color: #e0e0e0;
    font-family: "Segoe UI", "Ubuntu", "Noto Sans", sans-serif;
    font-size: 13px;
}
QWidget#topBar {
    background: #12122a;
    border-bottom: 1px solid #2a2a4a;
}
QWidget#sidebar {
    background: #1a1a2e;
    border-right: 1px solid #2a2a4a;
}
QWidget#bottomBar {
    background: #12122a;
    border-top: 1px solid #2a2a4a;
}
QWidget#mainPanel {
    background: #16213e;
}
QWidget#nowPlaying {
    background: transparent;
}
QWidget#controls {
    background: transparent;
}
QWidget#volumeWidget {
    background: transparent;
}
QWidget#sectionHeader {
    background: #1a1a2e;
    border-bottom: 1px solid #2a2a4a;
}
QSplitter::handle {
    background: #2a2a4a;
    width: 1px;
}

/* ── Tab Widget ──────────────────────────────────────────────── */
QTabWidget::pane {
    border: none;
    background: #1a1a2e;
}
QTabWidget::tab-bar {
    alignment: left;
}
QTabBar::tab {
    background: #1a1a2e;
    color: #8888aa;
    padding: 9px 14px;
    border: none;
    border-bottom: 2px solid transparent;
    font-size: 12px;
    font-weight: 500;
}
QTabBar::tab:selected {
    color: #e94560;
    border-bottom: 2px solid #e94560;
    background: #1a1a2e;
}
QTabBar::tab:hover:!selected {
    color: #c0c0d8;
    background: #1e1e38;
}

/* ── List Widgets ────────────────────────────────────────────── */
QListWidget {
    background: #16213e;
    border: none;
    outline: none;
}
QListWidget::item {
    border-radius: 4px;
    padding: 2px 4px;
    color: #e0e0e0;
}
QListWidget::item:selected {
    background: #0f3460;
    color: #e0e0e0;
}
QListWidget::item:hover:!selected {
    background: #1e2a50;
}
QListWidget#sideList {
    background: #1a1a2e;
    font-size: 12px;
}
QListWidget#sideList::item {
    padding: 7px 12px;
    border-radius: 6px;
    color: #c0c0d8;
}
QListWidget#sideList::item:selected {
    background: #0f3460;
    color: #e94560;
    font-weight: bold;
}

/* ── Input Fields ────────────────────────────────────────────── */
QLineEdit {
    background: #1a1a2e;
    border: 1px solid #2a2a4a;
    border-radius: 20px;
    padding: 7px 16px;
    color: #e0e0e0;
    font-size: 13px;
    selection-background-color: #0f3460;
}
QLineEdit:focus {
    border: 1px solid #e94560;
    background: #1e1e38;
}
QLineEdit::placeholder {
    color: #5a5a7a;
}

/* ── Combo Box ───────────────────────────────────────────────── */
QComboBox {
    background: #1a1a2e;
    border: 1px solid #2a2a4a;
    border-radius: 6px;
    padding: 5px 10px;
    color: #e0e0e0;
    font-size: 12px;
}
QComboBox:hover {
    border: 1px solid #0f3460;
}
QComboBox::drop-down {
    border: none;
    width: 20px;
}
QComboBox QAbstractItemView {
    background: #1a1a2e;
    border: 1px solid #2a2a4a;
    selection-background-color: #0f3460;
    color: #e0e0e0;
    outline: none;
}

/* ── Buttons ─────────────────────────────────────────────────── */
QPushButton {
    background: #0f3460;
    color: #e0e0e0;
    border-radius: 8px;
    border: none;
    padding: 7px 16px;
    font-size: 13px;
    font-weight: 500;
}
QPushButton:hover {
    background: #e94560;
}
QPushButton:pressed {
    background: #c03050;
}
QPushButton:disabled {
    background: #2a2a4a;
    color: #5a5a7a;
}
QPushButton#playBtn {
    background: #e94560;
    border-radius: 22px;
    min-width: 44px;
    max-width: 44px;
    min-height: 44px;
    max-height: 44px;
    font-size: 18px;
    padding: 0px;
}
QPushButton#playBtn:hover {
    background: #ff6080;
}
QPushButton#playBtn:pressed {
    background: #c03050;
}
QPushButton#iconBtn {
    background: transparent;
    border-radius: 18px;
    min-width: 36px;
    max-width: 36px;
    min-height: 36px;
    max-height: 36px;
    font-size: 18px;
    padding: 0px;
    color: #8888aa;
}
QPushButton#iconBtn:hover {
    background: #2a2a4a;
    color: #e0e0e0;
}
QPushButton#iconBtn:pressed {
    background: #0f3460;
}
QPushButton#favBtn {
    background: transparent;
    border-radius: 18px;
    min-width: 36px;
    max-width: 36px;
    min-height: 36px;
    max-height: 36px;
    font-size: 18px;
    padding: 0px;
    color: #5a5a7a;
}
QPushButton#favBtn:checked {
    color: #e94560;
}
QPushButton#favBtn:hover {
    background: #2a2a4a;
    color: #e94560;
}

/* ── Sliders ─────────────────────────────────────────────────── */
QSlider::groove:horizontal {
    background: #2a2a4a;
    height: 4px;
    border-radius: 2px;
}
QSlider::sub-page:horizontal {
    background: #e94560;
    border-radius: 2px;
}
QSlider::handle:horizontal {
    background: #e0e0e0;
    width: 12px;
    height: 12px;
    border-radius: 6px;
    margin: -4px 0;
}
QSlider::handle:horizontal:hover {
    background: #e94560;
}
QSlider::groove:vertical {
    background: #2a2a4a;
    width: 4px;
    border-radius: 2px;
}
QSlider::sub-page:vertical {
    background: #e94560;
    border-radius: 2px;
}
QSlider::handle:vertical {
    background: #e0e0e0;
    width: 12px;
    height: 12px;
    border-radius: 6px;
    margin: 0 -4px;
}

/* ── Scrollbars ──────────────────────────────────────────────── */
QScrollBar:vertical {
    background: #12122a;
    width: 6px;
    border-radius: 3px;
    margin: 0;
}
QScrollBar::handle:vertical {
    background: #3a3a5a;
    border-radius: 3px;
    min-height: 20px;
}
QScrollBar::handle:vertical:hover {
    background: #5a5a8a;
}
QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical { height: 0; }
QScrollBar::add-page:vertical, QScrollBar::sub-page:vertical { background: none; }
QScrollBar:horizontal {
    background: #12122a;
    height: 6px;
    border-radius: 3px;
}
QScrollBar::handle:horizontal {
    background: #3a3a5a;
    border-radius: 3px;
    min-width: 20px;
}
QScrollBar::add-line:horizontal, QScrollBar::sub-line:horizontal { width: 0; }

/* ── Labels ──────────────────────────────────────────────────── */
QLabel#stationName {
    font-size: 14px;
    font-weight: bold;
    color: #e0e0e0;
}
QLabel#metaLabel {
    font-size: 11px;
    color: #8888aa;
}
QLabel#sectionTitle {
    font-size: 13px;
    font-weight: bold;
    color: #c0c0d8;
    padding: 8px 12px;
}
QLabel#appTitle {
    font-size: 15px;
    font-weight: bold;
    color: #e94560;
    letter-spacing: 1px;
}
QLabel#timerLabel {
    font-size: 11px;
    color: #e94560;
    font-weight: bold;
}

/* ── Menu Bar ────────────────────────────────────────────────── */
QMenuBar {
    background: #12122a;
    color: #c0c0d8;
    border-bottom: 1px solid #2a2a4a;
    padding: 2px;
}
QMenuBar::item:selected {
    background: #0f3460;
    border-radius: 4px;
}
QMenu {
    background: #1a1a2e;
    border: 1px solid #2a2a4a;
    padding: 4px;
    color: #e0e0e0;
}
QMenu::item:selected {
    background: #0f3460;
    border-radius: 4px;
    color: #e0e0e0;
}
QMenu::separator {
    height: 1px;
    background: #2a2a4a;
    margin: 4px 0;
}

/* ── Status Bar ──────────────────────────────────────────────── */
QStatusBar {
    background: #12122a;
    color: #5a5a8a;
    font-size: 11px;
    border-top: 1px solid #1a1a2e;
}

/* ── Tooltips ────────────────────────────────────────────────── */
QToolTip {
    background: #1a1a2e;
    color: #e0e0e0;
    border: 1px solid #2a2a4a;
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 12px;
}

/* ── Spin Box ────────────────────────────────────────────────── */
QSpinBox {
    background: #1a1a2e;
    border: 1px solid #2a2a4a;
    border-radius: 6px;
    padding: 5px 10px;
    color: #e0e0e0;
    font-size: 13px;
}
QSpinBox::up-button, QSpinBox::down-button {
    background: #0f3460;
    border: none;
    width: 18px;
}
QSpinBox::up-button:hover, QSpinBox::down-button:hover {
    background: #e94560;
}

/* ── Group Box ───────────────────────────────────────────────── */
QGroupBox {
    border: 1px solid #2a2a4a;
    border-radius: 8px;
    margin-top: 12px;
    padding-top: 8px;
    color: #8888aa;
    font-size: 11px;
}
QGroupBox::title {
    subcontrol-origin: margin;
    left: 10px;
    padding: 0 5px;
    color: #8888aa;
}

/* ── Progress Bar ────────────────────────────────────────────── */
QProgressBar {
    background: #1a1a2e;
    border: 1px solid #2a2a4a;
    border-radius: 4px;
    text-align: center;
    color: #e0e0e0;
    font-size: 11px;
}
QProgressBar::chunk {
    background: #e94560;
    border-radius: 4px;
}
"""
