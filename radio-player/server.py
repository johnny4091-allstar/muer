#!/usr/bin/env python3
"""Radio Player — Flask web server for headless Ubuntu VPS."""

import hashlib
import json
import os
import secrets
import subprocess
import time
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

import requests
from flask import Flask, Response, jsonify, render_template, request, session, stream_with_context

app = Flask(__name__)

PORT    = int(os.environ.get("RADIO_PORT", 5000))
HOST    = os.environ.get("RADIO_HOST", "0.0.0.0")
DATA_DIR = Path.home() / ".config" / "radio-player"
DATA_DIR.mkdir(parents=True, exist_ok=True)
FAVORITES_FILE = DATA_DIR / "favorites.json"
RECENT_FILE    = DATA_DIR / "recent.json"
ALARM_FILE     = DATA_DIR / "alarms.json"
USERS_FILE     = DATA_DIR / "users.json"

# Persistent secret key so sessions survive service restarts
_skf = DATA_DIR / "secret.key"
app.secret_key = _skf.read_text().strip() if _skf.exists() else None
if not app.secret_key:
    app.secret_key = secrets.token_hex(32)
    _skf.write_text(app.secret_key)
del _skf

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


def _hash_pw(password: str, salt: str) -> str:
    return hashlib.sha256((salt + password).encode()).hexdigest()


def _fav_file() -> Path:
    username = session.get("username")
    return DATA_DIR / f"favs_{username}.json" if username else FAVORITES_FILE


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


# ── Auth ──────────────────────────────────────────────────────────

@app.route("/api/auth/me")
def auth_me():
    return jsonify({"username": session.get("username")})


@app.route("/api/auth/register", methods=["POST"])
def auth_register():
    data = request.get_json() or {}
    username = (data.get("username") or "").strip().lower()
    password = data.get("password") or ""
    if len(username) < 3 or not username.replace("_", "").isalnum():
        return jsonify({"error": "Username: 3+ letters/numbers/underscores"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400
    users = _read_json(USERS_FILE, {})
    if username in users:
        return jsonify({"error": "Username already taken"}), 409
    salt = secrets.token_hex(16)
    users[username] = {"hash": _hash_pw(password, salt), "salt": salt, "created": time.time()}
    _write_json(USERS_FILE, users)
    session["username"] = username
    return jsonify({"ok": True, "username": username})


@app.route("/api/auth/login", methods=["POST"])
def auth_login():
    data = request.get_json() or {}
    username = (data.get("username") or "").strip().lower()
    password = data.get("password") or ""
    users = _read_json(USERS_FILE, {})
    user = users.get(username)
    if not user or _hash_pw(password, user["salt"]) != user["hash"]:
        return jsonify({"error": "Invalid username or password"}), 401
    session["username"] = username
    return jsonify({"ok": True, "username": username})


@app.route("/api/auth/logout", methods=["POST"])
def auth_logout():
    session.pop("username", None)
    return jsonify({"ok": True})


# ── Favorites ─────────────────────────────────────────────────────

@app.route("/api/favorites")
def get_favorites():
    return jsonify(list(_read_json(_fav_file(), {}).values()))


@app.route("/api/favorites", methods=["POST"])
def add_favorite():
    station = request.get_json()
    if not station or not station.get("stationuuid"):
        return jsonify({"error": "invalid"}), 400
    favs = _read_json(_fav_file(), {})
    favs[station["stationuuid"]] = station
    _write_json(_fav_file(), favs)
    return jsonify({"ok": True})


@app.route("/api/favorites/<uuid>", methods=["DELETE"])
def remove_favorite(uuid):
    favs = _read_json(_fav_file(), {})
    favs.pop(uuid, None)
    _write_json(_fav_file(), favs)
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

# ── On-Demand Music ───────────────────────────────────────────────

MUSIC_GENRES = [
    ("Pop",        "pop hits"),
    ("Hip-Hop",    "hip hop rap"),
    ("Rock",       "rock"),
    ("R&B / Soul", "r&b soul"),
    ("Electronic", "electronic dance"),
    ("Country",    "country"),
    ("Jazz",       "jazz"),
    ("Classical",  "classical"),
    ("Indie",      "indie alternative"),
    ("K-Pop",      "k-pop"),
    ("Latin",      "latin"),
    ("Reggae",     "reggae"),
]


def _itunes_tracks(term: str, limit: int = 25) -> list:
    key = f"track:{term}:{limit}"
    if key in _cache:
        ts, data = _cache[key]
        if time.time() - ts < 300:
            return data
    try:
        url = (f"https://itunes.apple.com/search"
               f"?term={requests.utils.quote(term)}&entity=song&limit={limit}&media=music")
        r = requests.get(url, timeout=10, headers=API_HEADERS)
        results = [t for t in r.json().get("results", []) if t.get("previewUrl")]
        _cache[key] = (time.time(), results)
        return results
    except Exception:
        return []


@app.route("/api/music/genres")
def music_genres():
    return jsonify([{"name": n, "term": t} for n, t in MUSIC_GENRES])


@app.route("/api/music/featured")
def music_featured():
    """Mix of the first 5 genres for a diverse homepage grid."""
    results, seen = [], set()
    for _, term in MUSIC_GENRES[:6]:
        for t in _itunes_tracks(term, 8):
            tid = t.get("trackId")
            if tid and tid not in seen:
                seen.add(tid)
                results.append(t)
    return jsonify(results[:30])


@app.route("/api/music/charts")
def music_charts():
    genre = request.args.get("genre", "pop hits").strip()
    return jsonify(_itunes_tracks(genre, 30))


@app.route("/api/music/search")
def music_search_route():
    q = request.args.get("q", "").strip()
    if not q:
        return jsonify([])
    return jsonify(_itunes_tracks(q, 30))


def _ydlp_bin():
    """Return path to yt-dlp binary, checking common locations."""
    import shutil
    for candidate in [shutil.which("yt-dlp"), "/usr/local/bin/yt-dlp", "/usr/bin/yt-dlp"]:
        if candidate and os.path.isfile(candidate):
            return candidate
    return None


def _resolve_stream(query):
    """Return (cdn_url, ext) for the best audio of query, or (None, None).

    Prefer m4a/AAC because webm/opus is not supported on iOS Safari or many
    mobile browsers. Fall back through mp3 then any format as a last resort.
    """
    # m4a is universally supported (iOS, Android, desktop); webm/opus is not
    FMT = "bestaudio[ext=m4a]/bestaudio[ext=mp3]/bestaudio"

    def _pick_entry(info):
        if not info:
            return None
        if "entries" in info:
            entries = [e for e in (info.get("entries") or []) if e]
            return entries[0] if entries else None
        return info

    def _best_url(entry):
        """Extract (url, ext) preferring m4a from the formats list."""
        if not entry:
            return None, None
        # Top-level url is the selected format's URL
        url = entry.get("url", "")
        ext = (entry.get("ext") or "webm").lower()
        if url and url.startswith("http"):
            return url, ext
        # Walk formats, prefer m4a/mp3 over webm
        priority = {"m4a": 0, "mp4": 1, "mp3": 2}
        best_url, best_ext, best_pri = "", "webm", 99
        for fmt in entry.get("formats", []):
            if fmt.get("acodec") in (None, "none"):
                continue
            furl = fmt.get("url", "")
            if not furl.startswith("http"):
                continue
            fext = (fmt.get("ext") or "webm").lower()
            pri = priority.get(fext, 10)
            if pri < best_pri:
                best_url, best_ext, best_pri = furl, fext, pri
        return (best_url, best_ext) if best_url else (None, None)

    # ── Attempt 1: Python API ──────────────────────────────────────────
    try:
        import yt_dlp as ytdlp
        ydl_opts = {
            "format": FMT,
            "quiet": True,
            "no_warnings": True,
            "socket_timeout": 20,
        }
        with ytdlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(f"ytsearch1:{query}", download=False)
        entry = _pick_entry(info)
        url, ext = _best_url(entry)
        if url:
            return url, ext
    except Exception:
        pass  # fall through to CLI

    # ── Attempt 2: CLI with -j (dump JSON) ────────────────────────────
    bin_path = _ydlp_bin()
    if bin_path:
        try:
            result = subprocess.run(
                [bin_path, "-j", "--format", FMT, "--no-playlist",
                 f"ytsearch1:{query}"],
                capture_output=True, text=True, timeout=60,
            )
            if result.returncode == 0 and result.stdout.strip():
                info = json.loads(result.stdout.strip().splitlines()[-1])
                url, ext = _best_url(info)
                if url:
                    return url, ext
        except Exception:
            pass

    return None, None


@app.route("/api/music/stream/check")
def music_stream_check():
    """Diagnostic: report yt-dlp availability."""
    import shutil
    status = {}
    try:
        import yt_dlp
        status["python_api"] = True
        status["python_version"] = getattr(yt_dlp.version, "__version__", "?")
    except ImportError as e:
        status["python_api"] = False
        status["python_error"] = str(e)
    bin_path = _ydlp_bin()
    status["cli_path"] = bin_path
    if bin_path:
        try:
            r = subprocess.run([bin_path, "--version"], capture_output=True, text=True, timeout=5)
            status["cli_version"] = r.stdout.strip()
            status["cli_ok"] = r.returncode == 0
        except Exception as e:
            status["cli_ok"] = False
            status["cli_error"] = str(e)
    else:
        status["cli_ok"] = False
    return jsonify(status)


@app.route("/api/music/stream")
def music_stream_route():
    """Resolve track via yt-dlp then proxy CDN audio with correct MIME type."""
    name   = request.args.get("name",   "").strip()
    artist = request.args.get("artist", "").strip()
    if not name:
        return jsonify({"error": "no track name"}), 400

    query = f"{artist} {name}" if artist else name
    cdn_url, ext = _resolve_stream(query)

    if not cdn_url:
        bin_path = _ydlp_bin()
        if not bin_path:
            return jsonify({"error": "yt-dlp not installed — run update.sh"}), 503
        return jsonify({"error": "Could not resolve stream URL"}), 500

    ct_map = {
        "m4a": "audio/mp4", "mp4": "audio/mp4",
        "webm": "audio/webm", "mp3": "audio/mpeg",
        "ogg": "audio/ogg",  "opus": "audio/ogg",
    }
    content_type = ct_map.get(ext, "audio/webm")

    def generate():
        try:
            with requests.get(
                cdn_url, stream=True, timeout=60,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                                  "Chrome/124.0 Safari/537.36",
                    "Referer": "https://www.youtube.com/",
                },
            ) as r:
                for chunk in r.iter_content(chunk_size=65536):
                    if chunk:
                        yield chunk
        except Exception:
            pass

    return Response(
        stream_with_context(generate()),
        content_type=content_type,
        headers={"X-Accel-Buffering": "no", "Cache-Control": "no-store"},
    )


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
