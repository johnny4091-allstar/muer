from PyQt5.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QSlider, QComboBox, QGroupBox,
)
from PyQt5.QtCore import Qt, pyqtSignal

from .player import EQ_PRESETS, EQ_BANDS

BAND_LABELS = ["32Hz", "64Hz", "125Hz", "250Hz", "500Hz", "1kHz", "2kHz", "4kHz", "8kHz", "16kHz"]


class EqualizerDialog(QDialog):
    eq_applied = pyqtSignal(list)  # list of 10 float amp values

    def __init__(self, current_bands: list[float] = None, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Equalizer")
        self.setFixedSize(600, 320)

        if current_bands is None:
            current_bands = [0.0] * 10

        main_layout = QVBoxLayout(self)
        main_layout.setContentsMargins(16, 16, 16, 16)
        main_layout.setSpacing(12)

        # Preset row
        preset_row = QHBoxLayout()
        preset_label = QLabel("Preset:")
        self._preset_combo = QComboBox()
        self._preset_combo.addItems(list(EQ_PRESETS.keys()))
        self._preset_combo.currentTextChanged.connect(self._on_preset_changed)
        preset_row.addWidget(preset_label)
        preset_row.addWidget(self._preset_combo)
        preset_row.addStretch()
        main_layout.addLayout(preset_row)

        # Band sliders
        bands_group = QGroupBox("Frequency Bands")
        bands_layout = QHBoxLayout(bands_group)
        bands_layout.setSpacing(8)
        bands_layout.setContentsMargins(12, 16, 12, 12)

        self._sliders: list[QSlider] = []
        self._value_labels: list[QLabel] = []

        for i, label_text in enumerate(BAND_LABELS):
            col = QVBoxLayout()
            col.setAlignment(Qt.AlignHCenter)
            col.setSpacing(4)

            val_label = QLabel(f"{current_bands[i]:+.0f}")
            val_label.setAlignment(Qt.AlignCenter)
            val_label.setFixedWidth(36)
            val_label.setStyleSheet("font-size: 10px; color: #8888aa;")
            self._value_labels.append(val_label)

            slider = QSlider(Qt.Vertical)
            slider.setRange(-120, 120)   # ×0.1 = -12.0 to +12.0 dB
            slider.setValue(int(current_bands[i] * 10))
            slider.setFixedHeight(120)
            slider.setFixedWidth(20)
            slider.setTickPosition(QSlider.TicksBothSides)
            slider.setTickInterval(60)
            idx = i
            slider.valueChanged.connect(lambda v, ix=idx: self._on_slider(ix, v))
            self._sliders.append(slider)

            freq_label = QLabel(label_text)
            freq_label.setAlignment(Qt.AlignCenter)
            freq_label.setStyleSheet("font-size: 9px; color: #6688aa;")

            col.addWidget(val_label)
            col.addWidget(slider, alignment=Qt.AlignHCenter)
            col.addWidget(freq_label)
            bands_layout.addLayout(col)

        main_layout.addWidget(bands_group)

        # Buttons
        btn_row = QHBoxLayout()
        reset_btn = QPushButton("Reset")
        reset_btn.clicked.connect(self._reset)
        apply_btn = QPushButton("Apply")
        apply_btn.setDefault(True)
        apply_btn.clicked.connect(self._apply)
        close_btn = QPushButton("Close")
        close_btn.clicked.connect(self.reject)
        btn_row.addWidget(reset_btn)
        btn_row.addStretch()
        btn_row.addWidget(close_btn)
        btn_row.addWidget(apply_btn)
        main_layout.addLayout(btn_row)

    def _on_slider(self, index: int, value: int):
        amp = value / 10.0
        self._value_labels[index].setText(f"{amp:+.0f}")
        self._value_labels[index].setStyleSheet(
            f"font-size: 10px; color: {'#e94560' if abs(amp) > 6 else '#e0e0e0' if amp != 0 else '#8888aa'};"
        )

    def _on_preset_changed(self, preset_name: str):
        bands = EQ_PRESETS.get(preset_name, [0.0] * 10)
        for i, amp in enumerate(bands):
            self._sliders[i].blockSignals(True)
            self._sliders[i].setValue(int(amp * 10))
            self._sliders[i].blockSignals(False)
            self._value_labels[i].setText(f"{amp:+.0f}")

    def _reset(self):
        self._preset_combo.setCurrentText("Flat")
        for slider in self._sliders:
            slider.setValue(0)

    def _apply(self):
        bands = [s.value() / 10.0 for s in self._sliders]
        self.eq_applied.emit(bands)
        self.accept()

    def current_bands(self) -> list[float]:
        return [s.value() / 10.0 for s in self._sliders]
