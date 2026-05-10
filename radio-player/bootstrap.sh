#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
#  Radio Player — Bootstrap (run this on a fresh Ubuntu machine)
#
#  This script installs git (if needed), downloads the app,
#  and runs the full installer automatically.
#
#  Usage (one command, no pre-installs needed):
#    sudo bash -c "$(curl -fsSL https://raw.githubusercontent.com/johnny4091-allstar/muer/claude/radio-player-gui-2tCRd/radio-player/bootstrap.sh)"
#  or with wget:
#    sudo bash -c "$(wget -qO- https://raw.githubusercontent.com/johnny4091-allstar/muer/claude/radio-player-gui-2tCRd/radio-player/bootstrap.sh)"
# ─────────────────────────────────────────────────────────────────
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()    { echo -e "${CYAN}[INFO]${NC} $*"; }
success() { echo -e "${GREEN}[OK]${NC}   $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*" >&2; }

REPO_URL="https://github.com/johnny4091-allstar/muer.git"
BRANCH="claude/radio-player-gui-2tCRd"
CLONE_DIR="/tmp/radio-player-src"

echo ""
echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}${CYAN}         Radio Player — Bootstrap Installer           ${NC}"
echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ── 1. Root check ────────────────────────────────────────────────
if [ "$EUID" -ne 0 ]; then
    error "Please run with sudo:"
    echo "  sudo bash -c \"\$(curl -fsSL <url>/bootstrap.sh)\""
    exit 1
fi

# ── 2. Ubuntu check ──────────────────────────────────────────────
if ! command -v apt-get &>/dev/null; then
    error "apt-get not found — this script requires Ubuntu/Debian."
    exit 1
fi

# ── 3. Ensure lsb_release is available ──────────────────────────
if ! command -v lsb_release &>/dev/null; then
    info "Installing lsb-release…"
    apt-get install -y -qq lsb-release
fi

DISTRIB=$(lsb_release -is 2>/dev/null)
VERSION=$(lsb_release -rs 2>/dev/null)
MAJOR=$(echo "$VERSION" | cut -d. -f1)

if [ "$MAJOR" -lt 20 ]; then
    error "Ubuntu 20.04 or later required. Detected: $DISTRIB $VERSION"
    exit 1
fi
info "Detected $DISTRIB $VERSION — OK"

# ── 4. Install git and curl if missing ──────────────────────────
NEED_PKGS=()
command -v git  &>/dev/null || NEED_PKGS+=(git)
command -v curl &>/dev/null || NEED_PKGS+=(curl)

if [ ${#NEED_PKGS[@]} -gt 0 ]; then
    info "Installing prerequisites: ${NEED_PKGS[*]}"
    apt-get update -qq
    apt-get install -y -qq "${NEED_PKGS[@]}"
    success "Prerequisites installed"
fi

# ── 5. Clone the repository ──────────────────────────────────────
if [ -d "$CLONE_DIR" ]; then
    info "Removing previous download at $CLONE_DIR…"
    rm -rf "$CLONE_DIR"
fi

info "Downloading Radio Player from GitHub…"
git clone --depth=1 --branch "$BRANCH" "$REPO_URL" "$CLONE_DIR" 2>&1 \
    | grep -v "^$" || true
success "Downloaded successfully"

# ── 6. Run the real installer ────────────────────────────────────
INSTALLER="$CLONE_DIR/radio-player/install.sh"
if [ ! -f "$INSTALLER" ]; then
    error "install.sh not found at $INSTALLER"
    exit 1
fi

chmod +x "$INSTALLER"
info "Running installer…"
echo ""
bash "$INSTALLER"

# ── 7. Cleanup ───────────────────────────────────────────────────
rm -rf "$CLONE_DIR"
info "Temporary files cleaned up"
