import json
from pathlib import Path

CONFIG_DIR = Path.home() / ".config" / "radio-player"
FAVORITES_FILE = CONFIG_DIR / "favorites.json"


class FavoritesManager:
    def __init__(self):
        CONFIG_DIR.mkdir(parents=True, exist_ok=True)
        self._data: dict[str, dict] = {}
        self._load()

    def _load(self):
        if FAVORITES_FILE.exists():
            try:
                self._data = json.loads(FAVORITES_FILE.read_text())
            except (json.JSONDecodeError, OSError):
                self._data = {}

    def _save(self):
        try:
            FAVORITES_FILE.write_text(json.dumps(self._data, indent=2, ensure_ascii=False))
        except OSError:
            pass

    def add(self, station: dict):
        uuid = station.get("stationuuid", "")
        if uuid:
            self._data[uuid] = station
            self._save()

    def remove(self, station_uuid: str):
        if station_uuid in self._data:
            del self._data[station_uuid]
            self._save()

    def toggle(self, station: dict) -> bool:
        uuid = station.get("stationuuid", "")
        if self.is_favorite(uuid):
            self.remove(uuid)
            return False
        else:
            self.add(station)
            return True

    def is_favorite(self, station_uuid: str) -> bool:
        return station_uuid in self._data

    def all(self) -> list[dict]:
        return list(self._data.values())
