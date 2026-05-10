from PyQt5.QtCore import QObject, QTimer, pyqtSignal
from PyQt5.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel,
    QPushButton, QSpinBox,
)


class SleepTimer(QObject):
    timer_expired = pyqtSignal()
    tick = pyqtSignal(int)  # remaining seconds

    def __init__(self, parent=None):
        super().__init__(parent)
        self._remaining = 0
        self._timer = QTimer(self)
        self._timer.setInterval(1000)
        self._timer.timeout.connect(self._on_tick)

    def start(self, minutes: int):
        self._remaining = minutes * 60
        self._timer.start()
        self.tick.emit(self._remaining)

    def cancel(self):
        self._timer.stop()
        self._remaining = 0

    def is_active(self) -> bool:
        return self._timer.isActive()

    def remaining_seconds(self) -> int:
        return self._remaining

    def _on_tick(self):
        self._remaining -= 1
        self.tick.emit(self._remaining)
        if self._remaining <= 0:
            self._timer.stop()
            self.timer_expired.emit()


class SleepTimerDialog(QDialog):
    def __init__(self, current_minutes: int = 0, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Sleep Timer")
        self.setFixedSize(300, 160)
        self._minutes = current_minutes

        layout = QVBoxLayout(self)
        layout.setContentsMargins(20, 20, 20, 20)
        layout.setSpacing(16)

        label = QLabel("Stop playback after:")
        layout.addWidget(label)

        row = QHBoxLayout()
        self._spin = QSpinBox()
        self._spin.setRange(1, 360)
        self._spin.setValue(current_minutes if current_minutes > 0 else 30)
        self._spin.setSuffix(" minutes")
        self._spin.setMinimumWidth(150)
        row.addWidget(self._spin)
        row.addStretch()
        layout.addLayout(row)

        btns = QHBoxLayout()
        cancel_btn = QPushButton("Cancel Timer" if current_minutes > 0 else "Cancel")
        ok_btn = QPushButton("Set Timer")
        ok_btn.setDefault(True)
        cancel_btn.clicked.connect(self.reject)
        ok_btn.clicked.connect(self.accept)
        btns.addWidget(cancel_btn)
        btns.addStretch()
        btns.addWidget(ok_btn)
        layout.addLayout(btns)

        if current_minutes > 0:
            disable_btn = QPushButton("Disable Timer")
            disable_btn.clicked.connect(self._disable)
            layout.addWidget(disable_btn)

    def _disable(self):
        self._minutes = 0
        self.done(2)

    def selected_minutes(self) -> int:
        return self._spin.value()
