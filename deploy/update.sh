#!/usr/bin/env bash
# =============================================================================
# Muer Voice Assistant — Updater
# Pulls latest code, updates deps if needed, restarts service.
#
# Usage:
#   sudo bash deploy/update.sh
#   sudo bash deploy/update.sh --dir /opt/muer-assistant --user ubuntu
# =============================================================================

set -euo pipefail

INSTALL_DIR="/opt/muer-assistant"
SERVICE_USER="${SUDO_USER:-$(logname 2>/dev/null || echo ubuntu)}"
BRANCH="claude/voice-assistant-ubuntu-Nn1c7"

GREEN='\033[0;32m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'
RED='\033[0;31m'; BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "${CYAN}▶${RESET} $*"; }
success() { echo -e "${GREEN}✓${RESET} $*"; }
warn()    { echo -e "${YELLOW}⚠${RESET} $*"; }

while [[ $# -gt 0 ]]; do
    case $1 in
        --dir)    INSTALL_DIR="$2";  shift 2 ;;
        --user)   SERVICE_USER="$2"; shift 2 ;;
        --branch) BRANCH="$2";       shift 2 ;;
        *) echo "Unknown: $1"; exit 1 ;;
    esac
done

if [[ $EUID -ne 0 ]]; then
    echo -e "${RED}✗${RESET} Run with sudo:  sudo bash deploy/update.sh"
    exit 1
fi

echo -e "\n${BOLD}${CYAN}━━━ Muer Update ━━━${RESET}\n"
info "Install dir: $INSTALL_DIR | Branch: $BRANCH"

# ── Check current version ─────────────────────────────────────────────────────
cd "$INSTALL_DIR"
OLD_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
info "Current version: $OLD_SHA"

# ── Fetch & pull ──────────────────────────────────────────────────────────────
info "Fetching latest code..."
git fetch origin "$BRANCH" 2>&1 | sed 's/^/  /'

REMOTE_SHA=$(git rev-parse --short "origin/$BRANCH" 2>/dev/null || echo "")

if [[ "$OLD_SHA" == "$REMOTE_SHA" ]]; then
    success "Already up to date ($OLD_SHA). Nothing to do."
    exit 0
fi

info "Updating: $OLD_SHA → $REMOTE_SHA"
git pull origin "$BRANCH" 2>&1 | sed 's/^/  /'

# Copy updated source files
rsync -a --exclude='.env' --exclude='__pycache__' --exclude='*.pyc' \
    assistant/ "$INSTALL_DIR/assistant/"
rsync -a deploy/ "$INSTALL_DIR/deploy/"

success "Code updated."

# ── Deps (only if requirements.txt changed) ───────────────────────────────────
if git diff "$OLD_SHA" HEAD --name-only 2>/dev/null | grep -q "requirements.txt"; then
    info "requirements.txt changed — reinstalling Python packages..."
    "$INSTALL_DIR/venv/bin/pip" install -r "$INSTALL_DIR/assistant/requirements.txt" --quiet
    success "Dependencies updated."
fi

# ── Update systemd service files ──────────────────────────────────────────────
if git diff "$OLD_SHA" HEAD --name-only 2>/dev/null | grep -q "deploy/muer-assistant.service"; then
    info "Updating systemd service files..."
    cp "$INSTALL_DIR/deploy/muer-assistant.service" "/etc/systemd/system/muer-assistant@.service"
    cp "$INSTALL_DIR/deploy/muer-updater.service"   "/etc/systemd/system/muer-updater@.service"
    cp "$INSTALL_DIR/deploy/muer-updater.timer"     "/etc/systemd/system/muer-updater@.timer"
    systemctl daemon-reload
    success "Service files updated."
fi

# ── Fix ownership ─────────────────────────────────────────────────────────────
chown -R "$SERVICE_USER":"$SERVICE_USER" "$INSTALL_DIR"

# ── Restart service ───────────────────────────────────────────────────────────
info "Restarting muer-assistant..."
systemctl restart "muer-assistant@${SERVICE_USER}" 2>/dev/null && \
    success "Service restarted." || \
    warn "Could not restart service — start it with: sudo systemctl start muer-assistant@${SERVICE_USER}"

echo ""
NEW_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "?")
echo -e "${GREEN}${BOLD}Update complete: $OLD_SHA → $NEW_SHA${RESET}"
echo ""
echo "  Logs:    journalctl -u muer-assistant@${SERVICE_USER} -f"
echo "  Status:  sudo systemctl status muer-assistant@${SERVICE_USER}"
echo ""
