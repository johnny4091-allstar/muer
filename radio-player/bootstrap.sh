#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
#  Radio Player — Bootstrap for fresh Ubuntu 20.04+ server
#
#  Run these TWO commands in your SSH terminal (copy each line
#  separately — no angle brackets, no quotes around the URL):
#
#  Step 1:
#    wget -O /tmp/rp-bootstrap.sh https://raw.githubusercontent.com/johnny4091-allstar/muer/claude/radio-player-gui-2tCRd/radio-player/bootstrap.sh
#
#  Step 2:
#    sudo bash /tmp/rp-bootstrap.sh
# ─────────────────────────────────────────────────────────────────
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

info()    { echo -e "${CYAN}[INFO]${NC} $*"; }
success() { echo -e "${GREEN}[OK]${NC}   $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*" >&2; }

REPO_URL="https://github.com/johnny4091-allstar/muer.git"
BRANCH="claude/radio-player-gui-2tCRd"
CLONE_DIR="/tmp/radio-player-src"

echo ""
echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}${CYAN}         Radio Player — Bootstrap Installer           ${NC}"
echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Root check
if [ "$EUID" -ne 0 ]; then
    error "Run with sudo:  sudo bash /tmp/rp-bootstrap.sh"
    exit 1
fi

# apt check
if ! command -v apt-get &>/dev/null; then
    error "apt-get not found — requires Ubuntu/Debian."
    exit 1
fi

# Install git and wget if missing
NEED=()
command -v git  &>/dev/null || NEED+=(git)
command -v wget &>/dev/null || NEED+=(wget)

if [ ${#NEED[@]} -gt 0 ]; then
    info "Installing: ${NEED[*]}"
    apt-get update -qq
    apt-get install -y -qq "${NEED[@]}"
fi
success "Prerequisites ready"

# Clone repo
[ -d "$CLONE_DIR" ] && rm -rf "$CLONE_DIR"
info "Downloading from GitHub (branch: $BRANCH)…"
git clone --depth=1 --branch "$BRANCH" "$REPO_URL" "$CLONE_DIR" \
    --quiet 2>&1 | grep -v "^$" || true
success "Downloaded"

# Run installer
chmod +x "$CLONE_DIR/radio-player/install.sh"
echo ""
bash "$CLONE_DIR/radio-player/install.sh"

# Cleanup
rm -rf "$CLONE_DIR"
info "Temp files cleaned up"
