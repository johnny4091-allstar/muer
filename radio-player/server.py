#!/usr/bin/env python3
"""Radio Player — Flask web server for headless Ubuntu VPS."""

import json
import os
import time
from pathlib import Path

import requests
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

# ── Config ───────────────────────────────────────────────────────
PORT = int(os.environ.get("RADIO_PORT", 5000))
HOST = os.environ.get("RADIO_HOST", "0.0.0.0")
FAVORITES_FILE = Path.home() / ".config" / "radio-player" / "favorites.json"
FAVORITES_FILE.parent.mkdir(parents=True, exist_ok=True)

# ── Radio Browser API proxy ──────────────────────────────────────
MIRRORS = [
    "https://de1.api.radio-browser.info",
    "https://nl1.api.radio-browser.info",
    "https://at1.api.radio-browser.info",
]
API_HEADERS = {
    "User-Agent": "RadioPlayer/2.0 (linux-server; headless)",
    "Accept": "application/json",
}
_cache: dict = {}
_mirror_idx = 0


def _api_get(path: str, params: dict = None, ttl: int = 300) -> list:
    global _mirror_idx
    key = path + str(sorted((params or {}).items()))
    if key in _cache:
        ts, data = _cache[key]
        if time.time() - ts < ttl:
            return data

    for _ in range(len(MIRRORS)):
        url = MIRRORS[_mirror_idx % len(MIRRORS)] + path
        try:
            r = requests.get(url, params=params, headers=API_HEADERS, timeout=10)
            r.raise_for_status()
            data = r.json()
            _cache[key] = (time.time(), data)
            return data
        except Exception:
            _mirror_idx += 1
    return []


# ── Favorites helpers ────────────────────────────────────────────

def _load_favorites() -> dict:
    if FAVORITES_FILE.exists():
        try:
            return json.loads(FAVORITES_FILE.read_text())
        except Exception:
            pass
    return {}


def _save_favorites(data: dict):
    FAVORITES_FILE.write_text(json.dumps(data, indent=2, ensure_ascii=False))


# ── Routes: frontend ─────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html")


# ── Routes: API proxy ────────────────────────────────────────────

@app.route("/api/top")
def api_top():
    limit = request.args.get("limit", 100, type=int)
    data = _api_get(f"/json/stations/topclick/{limit}", ttl=120)
    return jsonify(data)


@app.route("/api/search")
def api_search():
    q = request.args.get("q", "").strip()
    if not q:
        return jsonify([])
    data = _api_get(
        "/json/search",
        params={"name": q, "limit": 80, "order": "votes", "reverse": "true", "hidebroken": "true"},
        ttl=60,
    )
    return jsonify(data)


@app.route("/api/country/<path:country>")
def api_country(country):
    data = _api_get(
        f"/json/stations/bycountryexact/{requests.utils.quote(country)}",
        params={"limit": 200, "order": "votes", "reverse": "true", "hidebroken": "true"},
    )
    return jsonify(data)


@app.route("/api/tag/<path:tag>")
def api_tag(tag):
    data = _api_get(
        f"/json/stations/bytag/{requests.utils.quote(tag)}",
        params={"limit": 200, "order": "votes", "reverse": "true", "hidebroken": "true"},
    )
    return jsonify(data)


@app.route("/api/countries")
def api_countries():
    data = _api_get("/json/countries", ttl=3600)
    filtered = sorted(
        [c for c in data if c.get("name") and c.get("stationcount", 0) > 5],
        key=lambda c: c["name"],
    )
    return jsonify(filtered)


@app.route("/api/tags")
def api_tags():
    data = _api_get(
        "/json/tags",
        params={"limit": 150, "order": "stationcount", "reverse": "true", "hidebroken": "true"},
        ttl=3600,
    )
    filtered = [t for t in data if t.get("name") and t.get("stationcount", 0) > 10]
    return jsonify(filtered)


# ── Routes: favorites ────────────────────────────────────────────

@app.route("/api/favorites")
def get_favorites():
    return jsonify(list(_load_favorites().values()))


@app.route("/api/favorites", methods=["POST"])
def add_favorite():
    station = request.get_json()
    if not station or not station.get("stationuuid"):
        return jsonify({"error": "invalid station"}), 400
    favs = _load_favorites()
    favs[station["stationuuid"]] = station
    _save_favorites(favs)
    return jsonify({"ok": True})


@app.route("/api/favorites/<uuid>", methods=["DELETE"])
def remove_favorite(uuid):
    favs = _load_favorites()
    favs.pop(uuid, None)
    _save_favorites(favs)
    return jsonify({"ok": True})


if __name__ == "__main__":
    print(f"  Radio Player running at http://<your-server-ip>:{PORT}")
    print(f"  Press Ctrl+C to stop.\n")
    app.run(host=HOST, port=PORT, debug=False)
