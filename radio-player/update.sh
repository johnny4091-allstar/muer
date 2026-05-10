#!/usr/bin/env bash
# Radio Player — Update script (curl-based, no git required)
# Usage: sudo bash /opt/radio-player/update.sh
set -euo pipefail

BRANCH="claude/radio-player-gui-2tCRd"
RAW="https://raw.githubusercontent.com/johnny4091-allstar/muer/${BRANCH}/radio-player"
INSTALL="/opt/radio-player"

echo "=============================="
echo " Radio Player Updater"
echo "=============================="

# ── 1. Download latest app files ──────────────────────────────────
echo "[1/4] Downloading latest files from GitHub..."
curl -fsSL "${RAW}/server.py"              -o "${INSTALL}/server.py"
curl -fsSL "${RAW}/update.sh"              -o "${INSTALL}/update.sh"
curl -fsSL "${RAW}/requirements.txt"       -o "${INSTALL}/requirements.txt"
curl -fsSL "${RAW}/static/css/style.css"   -o "${INSTALL}/static/css/style.css"
curl -fsSL "${RAW}/static/js/app.js"       -o "${INSTALL}/static/js/app.js"
curl -fsSL "${RAW}/templates/index.html"   -o "${INSTALL}/templates/index.html"
echo "     Files updated."

# ── 2. Install yt-dlp standalone binary ───────────────────────────
echo "[2/4] Installing yt-dlp standalone binary..."
curl -fsSL "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp" \
    -o /usr/local/bin/yt-dlp
chmod a+rx /usr/local/bin/yt-dlp
YTV=$(/usr/local/bin/yt-dlp --version 2>/dev/null || echo "unknown")
echo "     yt-dlp ${YTV} installed at /usr/local/bin/yt-dlp"

# ── 3. Optional: Python package (best-effort, skip on failure) ─────
echo "[3/4] Trying Python yt-dlp package (optional)..."
pip3 install yt-dlp flask requests -q --upgrade --break-system-packages 2>/dev/null \
  || pip3 install yt-dlp flask requests -q --upgrade 2>/dev/null \
  || echo "     pip install skipped (standalone binary is sufficient)"

# ── 4. Restart service ─────────────────────────────────────────────
echo "[4/4] Restarting radio-player service..."
systemctl restart radio-player
sleep 2
if systemctl is-active --quiet radio-player; then
    echo ""
    echo "[OK] Radio Player updated and running!"
    VER=$(curl -s http://localhost:5000/api/version 2>/dev/null || echo '{"version":"?"}')
    echo "     Server version: ${VER}"
else
    echo "[WARN] Service may have failed — check: journalctl -u radio-player -n 30"
fi
