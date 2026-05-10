#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
#  Radio Player — Uninstaller
#  Usage: sudo radio-player-uninstall   or   sudo ./uninstall.sh
# ─────────────────────────────────────────────────────────────────
set -euo pipefail

GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

if [ "$EUID" -ne 0 ]; then
    echo "Please run as root: sudo ./uninstall.sh"
    exit 1
fi

echo -e "${CYAN}Uninstalling Radio Player…${NC}"

rm -f /usr/local/bin/radio-player
rm -f /usr/local/bin/radio-player-uninstall
rm -f /usr/share/applications/radio-player.desktop
rm -rf /opt/radio-player

if command -v update-desktop-database &>/dev/null; then
    update-desktop-database /usr/share/applications 2>/dev/null || true
fi

echo -e "${GREEN}Radio Player uninstalled.${NC}"
echo ""
echo "  User config at ~/.config/radio-player/ was NOT removed."
echo "  To remove it:  rm -rf ~/.config/radio-player/"
echo ""
