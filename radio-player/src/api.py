import time
import requests
from PyQt5.QtCore import QThread, pyqtSignal

MIRRORS = [
    "https://de1.api.radio-browser.info",
    "https://nl1.api.radio-browser.info",
    "https://at1.api.radio-browser.info",
]

HEADERS = {
    "User-Agent": "RadioPlayer/1.0 (linux; desktop)",
    "Accept": "application/json",
}


class RadioBrowserAPI:
    def __init__(self):
        self._session = requests.Session()
        self._session.headers.update(HEADERS)
        self._cache: dict = {}
        self._mirror_index = 0
        self.last_error: str = ""

    def _base(self) -> str:
        return MIRRORS[self._mirror_index % len(MIRRORS)]

    def _get(self, path: str, params: dict = None, cache_ttl: int = 300) -> list:
        cache_key = path + str(params)
        if cache_key in self._cache:
            ts, data = self._cache[cache_key]
            if time.time() - ts < cache_ttl:
                return data

        for attempt in range(len(MIRRORS)):
            url = self._base() + path
            try:
                resp = self._session.get(url, params=params, timeout=10)
                resp.raise_for_status()
                data = resp.json()
                self._cache[cache_key] = (time.time(), data)
                self.last_error = ""
                return data
            except Exception as e:
                self.last_error = str(e)
                self._mirror_index += 1

        return []

    def top_stations(self, limit: int = 100) -> list:
        return self._get(f"/json/stations/topclick/{limit}", cache_ttl=120)

    def search(self, query: str, limit: int = 80) -> list:
        return self._get(
            "/json/search",
            params={"name": query, "limit": limit, "order": "votes", "reverse": "true"},
            cache_ttl=60,
        )

    def stations_by_country(self, country: str, limit: int = 200) -> list:
        return self._get(
            "/json/stations/bycountryexact/" + requests.utils.quote(country),
            params={"limit": limit, "order": "votes", "reverse": "true"},
            cache_ttl=300,
        )

    def stations_by_tag(self, tag: str, limit: int = 200) -> list:
        return self._get(
            "/json/stations/bytag/" + requests.utils.quote(tag),
            params={"limit": limit, "order": "votes", "reverse": "true"},
            cache_ttl=300,
        )

    def list_countries(self) -> list:
        data = self._get("/json/countries", cache_ttl=3600)
        return sorted(
            [c for c in data if c.get("name") and c.get("stationcount", 0) > 5],
            key=lambda c: c["name"],
        )

    def list_tags(self, limit: int = 150) -> list:
        data = self._get(
            "/json/tags",
            params={"limit": limit, "order": "stationcount", "reverse": "true", "hidebroken": "true"},
            cache_ttl=3600,
        )
        return [t for t in data if t.get("name") and t.get("stationcount", 0) > 10]


class ApiWorker(QThread):
    result = pyqtSignal(list)
    error = pyqtSignal(str)

    def __init__(self, api: RadioBrowserAPI, method: str, **kwargs):
        super().__init__()
        self._api = api
        self._method = method
        self._kwargs = kwargs

    def run(self):
        try:
            fn = getattr(self._api, self._method)
            data = fn(**self._kwargs)
            self.result.emit(data)
        except Exception as e:
            self.error.emit(str(e))


class FaviconWorker(QThread):
    loaded = pyqtSignal(str, bytes)  # url, image_bytes

    def __init__(self, url: str):
        super().__init__()
        self._url = url

    def run(self):
        try:
            resp = requests.get(self._url, timeout=5, headers=HEADERS)
            if resp.status_code == 200 and resp.content:
                self.loaded.emit(self._url, resp.content)
        except Exception:
            pass
