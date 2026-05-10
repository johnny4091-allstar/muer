#!/usr/bin/env bash
# Radio Player — Uninstaller
set -euo pipefail

if [ "$EUID" -ne 0 ]; then echo "Run as root: sudo ./uninstall.sh"; exit 1; fi

echo "Uninstalling Radio Player…"

systemctl stop    radio-player 2>/dev/null || true
systemctl disable radio-player 2>/dev/null || true
rm -f /etc/systemd/system/radio-player.service
systemctl daemon-reload

rm -rf /opt/radio-player

if command -v ufw &>/dev/null; then
    ufw delete allow 5000/tcp 2>/dev/null || true
fi

echo "Radio Player uninstalled."
echo "Favorites at ~/.config/radio-player/ were NOT removed."
echo "To remove them: rm -rf ~/.config/radio-player/"
