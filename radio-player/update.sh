#!/usr/bin/env bash
# Radio Player — Update script
# Usage: sudo bash /opt/radio-player/update.sh
set -euo pipefail

OWNER="johnny4091-allstar"
REPO="muer"
BRANCH_ENC="claude%2Fradio-player-gui-2tCRd"   # URL-encoded (slash → %2F)
GH="https://api.github.com/repos/${OWNER}/${REPO}/contents"
HDR="Accept: application/vnd.github.v3.raw"
INSTALL="/opt/radio-player"

echo "=============================="
echo " Radio Player Updater"
echo "=============================="

# ── 1. Download latest app files via GitHub API ────────────────────
echo "[1/4] Downloading latest files from GitHub..."
_dl() { curl -fsSL -H "${HDR}" "${GH}/$1?ref=${BRANCH_ENC}" -o "$2" && echo "  ✓ $1"; }

_dl "radio-player/server.py"            "${INSTALL}/server.py"
_dl "radio-player/update.sh"            "${INSTALL}/update.sh"
_dl "radio-player/requirements.txt"     "${INSTALL}/requirements.txt"
_dl "radio-player/static/css/style.css" "${INSTALL}/static/css/style.css"
_dl "radio-player/static/js/app.js"     "${INSTALL}/static/js/app.js"
_dl "radio-player/templates/index.html" "${INSTALL}/templates/index.html"

# ── 2. Install yt-dlp standalone binary ───────────────────────────
echo "[2/4] Installing yt-dlp standalone binary..."
curl -fsSL "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp" \
    -o /usr/local/bin/yt-dlp
chmod a+rx /usr/local/bin/yt-dlp
YTV=$(/usr/local/bin/yt-dlp --version 2>/dev/null || echo "unknown")
echo "  ✓ yt-dlp ${YTV} at /usr/local/bin/yt-dlp"

# ── 3. Optional: Python package (best-effort) ──────────────────────
echo "[3/4] Trying pip install (optional)..."
pip3 install yt-dlp flask requests -q --upgrade --break-system-packages 2>/dev/null \
  || pip3 install yt-dlp flask requests -q --upgrade 2>/dev/null \
  || echo "  (skipped — standalone binary is sufficient)"

# ── 4. Restart service ─────────────────────────────────────────────
echo "[4/4] Restarting radio-player service..."
systemctl restart radio-player
sleep 2
if systemctl is-active --quiet radio-player; then
    VER=$(curl -s http://localhost:5000/api/version 2>/dev/null || echo '{"version":"?"}')
    echo ""
    echo "[OK] Updated and running! Server version: ${VER}"
else
    echo "[WARN] Service issue — check: journalctl -u radio-player -n 30"
fi
