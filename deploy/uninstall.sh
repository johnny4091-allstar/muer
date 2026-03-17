#!/usr/bin/env bash
# =============================================================================
# Muer Voice Assistant — Uninstaller
# Removes service, files, and optionally system packages.
#
# Usage:
#   sudo bash deploy/uninstall.sh
#   sudo bash deploy/uninstall.sh --dir /opt/muer-assistant --user ubuntu
#   sudo bash deploy/uninstall.sh --purge   # also remove system packages
# =============================================================================

set -euo pipefail

INSTALL_DIR="/opt/muer-assistant"
SERVICE_USER="${SUDO_USER:-$(logname 2>/dev/null || echo ubuntu)}"
PURGE=false

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "${CYAN}▶${RESET} $*"; }
success() { echo -e "${GREEN}✓${RESET} $*"; }
warn()    { echo -e "${YELLOW}⚠${RESET} $*"; }

while [[ $# -gt 0 ]]; do
    case $1 in
        --dir)   INSTALL_DIR="$2";  shift 2 ;;
        --user)  SERVICE_USER="$2"; shift 2 ;;
        --purge) PURGE=true;        shift   ;;
        *) echo "Unknown: $1"; exit 1 ;;
    esac
done

if [[ $EUID -ne 0 ]]; then
    echo -e "${RED}✗${RESET} Run with sudo:  sudo bash deploy/uninstall.sh"
    exit 1
fi

echo -e "\n${BOLD}${RED}━━━ Muer Uninstaller ━━━${RESET}\n"
warn "This will remove the Muer Voice Assistant from this server."
[[ $PURGE == true ]] && warn "  --purge: will also remove mpv, ffmpeg, espeak, portaudio"
echo ""
read -rp "  Are you sure? [y/N] " confirm
[[ "${confirm,,}" != "y" ]] && echo "Aborted." && exit 0
echo ""

# ── Stop and disable services ─────────────────────────────────────────────────
for svc in "muer-assistant@${SERVICE_USER}" "muer-updater@${SERVICE_USER}.timer" "muer-updater@${SERVICE_USER}"; do
    if systemctl is-active --quiet "$svc" 2>/dev/null; then
        info "Stopping $svc..."
        systemctl stop "$svc" 2>/dev/null || true
    fi
    systemctl disable "$svc" 2>/dev/null || true
done

# ── Remove systemd files ──────────────────────────────────────────────────────
for f in \
    "/etc/systemd/system/muer-assistant@.service" \
    "/etc/systemd/system/muer-updater@.service" \
    "/etc/systemd/system/muer-updater@.timer"; do
    [[ -f "$f" ]] && rm -f "$f" && info "Removed $f"
done
systemctl daemon-reload
success "systemd services removed."

# ── Remove install directory ──────────────────────────────────────────────────
if [[ -d "$INSTALL_DIR" ]]; then
    # Backup .env just in case
    if [[ -f "$INSTALL_DIR/.env" ]]; then
        cp "$INSTALL_DIR/.env" "/tmp/muer-assistant.env.bak"
        warn "Config backed up to /tmp/muer-assistant.env.bak"
    fi
    rm -rf "$INSTALL_DIR"
    success "Removed $INSTALL_DIR"
fi

# ── Remove data directory ─────────────────────────────────────────────────────
DATA_DIR=$(eval echo "~${SERVICE_USER}/.config/muer-assistant")
if [[ -d "$DATA_DIR" ]]; then
    read -rp "  Remove saved data (alarms, lists, notes) at $DATA_DIR? [y/N] " rm_data
    if [[ "${rm_data,,}" == "y" ]]; then
        rm -rf "$DATA_DIR"
        success "Removed $DATA_DIR"
    else
        info "Keeping $DATA_DIR"
    fi
fi

# ── Purge system packages ─────────────────────────────────────────────────────
if [[ $PURGE == true ]]; then
    info "Removing system packages..."
    apt-get remove -y mpv ffmpeg espeak libespeak-dev portaudio19-dev \
        libsndfile1 xclip libnotify-bin 2>/dev/null || true
    apt-get autoremove -y --quiet
    success "System packages removed."
fi

echo ""
echo -e "${GREEN}${BOLD}Muer Voice Assistant has been uninstalled.${RESET}"
[[ -f "/tmp/muer-assistant.env.bak" ]] && \
    echo "  Your old config is at /tmp/muer-assistant.env.bak"
echo ""
