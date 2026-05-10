#!/usr/bin/env bash
# Radio Player — Update script
# Usage: sudo bash /opt/radio-player/update.sh
set -euo pipefail

REPO="https://github.com/johnny4091-allstar/muer"
BRANCH="claude/radio-player-gui-2tCRd"
TMP="/tmp/rp-update"
INSTALL="/opt/radio-player"

echo "[INFO] Pulling latest Radio Player files..."
rm -rf "$TMP"
git clone --depth 1 --branch "$BRANCH" "$REPO" "$TMP" --quiet

echo "[INFO] Copying updated files..."
cp -r "$TMP/radio-player/static"          "$INSTALL/"
cp -r "$TMP/radio-player/templates"       "$INSTALL/"
cp    "$TMP/radio-player/server.py"       "$INSTALL/"
cp    "$TMP/radio-player/update.sh"       "$INSTALL/"
cp    "$TMP/radio-player/requirements.txt" "$INSTALL/"

echo "[INFO] Installing/upgrading Python dependencies..."
# --break-system-packages needed on Ubuntu 22.04+ (PEP 668 externally-managed env)
pip3 install -r "$INSTALL/requirements.txt" -q --upgrade --break-system-packages 2>/dev/null \
  || pip3 install -r "$INSTALL/requirements.txt" -q --upgrade 2>/dev/null \
  || true

echo "[INFO] Installing yt-dlp standalone binary (works regardless of pip/Python version)..."
curl -fsSL "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp" \
  -o /usr/local/bin/yt-dlp && chmod a+rx /usr/local/bin/yt-dlp \
  && echo "[OK] yt-dlp $(/usr/local/bin/yt-dlp --version) installed at /usr/local/bin/yt-dlp" \
  || echo "[WARN] Could not install yt-dlp binary — check internet access"

rm -rf "$TMP"
echo "[INFO] Restarting service..."
systemctl restart radio-player
sleep 2
systemctl is-active --quiet radio-player && echo "[OK] Radio Player updated and running!" || echo "[WARN] Check: journalctl -u radio-player -n 20"
