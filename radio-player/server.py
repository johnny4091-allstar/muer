#!/usr/bin/env python3
"""Radio Player — Flask web server for headless Ubuntu VPS."""

import json
import os
import time
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

import requests
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

PORT    = int(os.environ.get("RADIO_PORT", 5000))
HOST    = os.environ.get("RADIO_HOST", "0.0.0.0")
DATA_DIR = Path.home() / ".config" / "radio-player"
DATA_DIR.mkdir(parents=True, exist_ok=True)
FAVORITES_FILE    = DATA_DIR / "favorites.json"
RECENT_FILE       = DATA_DIR / "recent.json"
ALARM_FILE        = DATA_DIR / "alarms.json"

# ── Radio Browser API ─────────────────────────────────────────────
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


# ── JSON file helpers ─────────────────────────────────────────────

def _read_json(path: Path, default):
    if path.exists():
        try:
            return json.loads(path.read_text())
        except Exception:
            pass
    return default


def _write_json(path: Path, data):
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False))


# ── Frontend ──────────────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html")


# ── Radio station routes ──────────────────────────────────────────

@app.route("/api/top")
def api_top():
    limit = request.args.get("limit", 100, type=int)
    return jsonify(_api_get(f"/json/stations/topclick/{limit}", ttl=120))


@app.route("/api/search")
def api_search():
    q = request.args.get("q", "").strip()
    if not q:
        return jsonify([])
    return jsonify(_api_get("/json/search",
        params={"name": q, "limit": 80, "order": "votes",
                "reverse": "true", "hidebroken": "true"}, ttl=60))


@app.route("/api/country/<path:country>")
def api_country(country):
    return jsonify(_api_get(
        f"/json/stations/bycountryexact/{requests.utils.quote(country)}",
        params={"limit": 200, "order": "votes", "reverse": "true", "hidebroken": "true"}))


@app.route("/api/tag/<path:tag>")
def api_tag(tag):
    return jsonify(_api_get(
        f"/json/stations/bytag/{requests.utils.quote(tag)}",
        params={"limit": 200, "order": "votes", "reverse": "true", "hidebroken": "true"}))


@app.route("/api/countries")
def api_countries():
    data = _api_get("/json/countries", ttl=3600)
    return jsonify(sorted(
        [c for c in data if c.get("name") and c.get("stationcount", 0) > 5],
        key=lambda c: c["name"]))


@app.route("/api/tags")
def api_tags():
    data = _api_get("/json/tags",
        params={"limit": 150, "order": "stationcount", "reverse": "true", "hidebroken": "true"},
        ttl=3600)
    return jsonify([t for t in data if t.get("name") and t.get("stationcount", 0) > 10])


@app.route("/api/trending")
def api_trending():
    return jsonify(_api_get("/json/stations/topvote/50", ttl=300))


# ── Favorites ─────────────────────────────────────────────────────

@app.route("/api/favorites")
def get_favorites():
    return jsonify(list(_read_json(FAVORITES_FILE, {}).values()))


@app.route("/api/favorites", methods=["POST"])
def add_favorite():
    station = request.get_json()
    if not station or not station.get("stationuuid"):
        return jsonify({"error": "invalid"}), 400
    favs = _read_json(FAVORITES_FILE, {})
    favs[station["stationuuid"]] = station
    _write_json(FAVORITES_FILE, favs)
    return jsonify({"ok": True})


@app.route("/api/favorites/<uuid>", methods=["DELETE"])
def remove_favorite(uuid):
    favs = _read_json(FAVORITES_FILE, {})
    favs.pop(uuid, None)
    _write_json(FAVORITES_FILE, favs)
    return jsonify({"ok": True})


# ── Recently played ───────────────────────────────────────────────

@app.route("/api/recent")
def get_recent():
    return jsonify(_read_json(RECENT_FILE, []))


@app.route("/api/recent", methods=["POST"])
def add_recent():
    item = request.get_json()
    if not item:
        return jsonify({"error": "invalid"}), 400
    recent = _read_json(RECENT_FILE, [])
    # Remove duplicate
    recent = [r for r in recent if r.get("id") != item.get("id")]
    recent.insert(0, {**item, "played_at": time.time()})
    _write_json(RECENT_FILE, recent[:50])
    return jsonify({"ok": True})


# ── Podcasts ──────────────────────────────────────────────────────

PODCAST_CATEGORIES = [
    ("True Crime",  "true crime podcast"),
    ("Comedy",      "comedy podcast"),
    ("News",        "daily news podcast"),
    ("Technology",  "technology podcast"),
    ("Sports",      "sports podcast"),
    ("Health",      "health wellness podcast"),
    ("Business",    "business entrepreneurship"),
    ("Education",   "education learning podcast"),
    ("Science",     "science podcast"),
    ("Society",     "society culture podcast"),
]


def _itunes_search(term: str, limit: int = 20) -> list:
    cache_key = f"itunes:{term}:{limit}"
    if cache_key in _cache:
        ts, data = _cache[cache_key]
        if time.time() - ts < 600:
            return data
    try:
        url = (f"https://itunes.apple.com/search"
               f"?term={requests.utils.quote(term)}&entity=podcast&limit={limit}&media=podcast")
        r = requests.get(url, timeout=10, headers=API_HEADERS)
        results = r.json().get("results", [])
        _cache[cache_key] = (time.time(), results)
        return results
    except Exception:
        return []


@app.route("/api/podcasts/search")
def podcast_search():
    q = request.args.get("q", "").strip()
    if not q:
        return jsonify([])
    return jsonify(_itunes_search(q, 30))


@app.route("/api/podcasts/featured")
def podcast_featured():
    results = []
    for _, term in PODCAST_CATEGORIES[:6]:
        hits = _itunes_search(term, 4)
        results.extend(hits[:2])
    seen = set()
    out = []
    for p in results:
        pid = p.get("collectionId")
        if pid and pid not in seen:
            seen.add(pid)
            out.append(p)
    return jsonify(out[:24])


@app.route("/api/podcasts/categories")
def podcast_categories():
    return jsonify([{"name": n, "term": t} for n, t in PODCAST_CATEGORIES])


@app.route("/api/podcasts/category")
def podcast_by_category():
    term = request.args.get("term", "").strip()
    if not term:
        return jsonify([])
    return jsonify(_itunes_search(term, 30))


@app.route("/api/podcasts/episodes")
def podcast_episodes():
    feed_url = request.args.get("url", "").strip()
    if not feed_url:
        return jsonify([])
    try:
        req = urllib.request.Request(
            feed_url,
            headers={"User-Agent": "RadioPlayer/2.0", "Accept": "application/rss+xml,application/xml,*/*"})
        with urllib.request.urlopen(req, timeout=12) as resp:
            xml_bytes = resp.read()
        root = ET.fromstring(xml_bytes)
        channel = root.find("channel") or root
        ITUNES = "http://www.itunes.com/dtds/podcast-1.0.dtd"
        episodes = []
        for item in channel.findall("item")[:40]:
            enclosure = item.find("enclosure")
            audio_url = enclosure.get("url") if enclosure is not None else None
            if not audio_url:
                continue
            # Episode image (itunes:image > channel image)
            ep_img_el = item.find(f"{{{ITUNES}}}image")
            ep_img = (ep_img_el.get("href") if ep_img_el is not None else None) or ""
            desc = item.findtext("description") or item.findtext(f"{{{ITUNES}}}summary") or ""
            # Strip HTML tags from description
            import re
            desc = re.sub(r"<[^>]+>", "", desc)[:300]
            episodes.append({
                "title":     item.findtext("title") or "Untitled",
                "audio_url": audio_url,
                "duration":  item.findtext(f"{{{ITUNES}}}duration") or "",
                "pub_date":  item.findtext("pubDate") or "",
                "image":     ep_img,
                "description": desc.strip(),
            })
        return jsonify(episodes)
    except Exception as e:
        return jsonify({"error": str(e)}), 400


# ── Alarms (server-side store) ────────────────────────────────────

@app.route("/api/alarms")
def get_alarms():
    return jsonify(_read_json(ALARM_FILE, []))


@app.route("/api/alarms", methods=["POST"])
def save_alarms():
    alarms = request.get_json()
    if not isinstance(alarms, list):
        return jsonify({"error": "invalid"}), 400
    _write_json(ALARM_FILE, alarms)
    return jsonify({"ok": True})


if __name__ == "__main__":
    print(f"\n  Radio Player running at http://0.0.0.0:{PORT}")
    print(f"  Open http://<your-server-ip>:{PORT} in your browser\n")
    app.run(host=HOST, port=PORT, debug=False)
