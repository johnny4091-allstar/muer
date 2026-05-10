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
cp -r "$TMP/radio-player/static"    "$INSTALL/"
cp -r "$TMP/radio-player/templates" "$INSTALL/"
cp    "$TMP/radio-player/server.py" "$INSTALL/"
cp    "$TMP/radio-player/update.sh" "$INSTALL/"

rm -rf "$TMP"
echo "[INFO] Restarting service..."
systemctl restart radio-player
sleep 2
systemctl is-active --quiet radio-player && echo "[OK] Radio Player updated and running!" || echo "[WARN] Check: journalctl -u radio-player -n 20"
