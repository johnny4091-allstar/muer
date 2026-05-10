#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
#  Radio Player — Installer for Ubuntu 20.04+
#  Usage: sudo ./install.sh
# ─────────────────────────────────────────────────────────────────
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()    { echo -e "${CYAN}[INFO]${NC} $*"; }
success() { echo -e "${GREEN}[OK]${NC}   $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# ── 1. Root check ────────────────────────────────────────────────
if [ "$EUID" -ne 0 ]; then
    error "This script must be run as root."
    echo "  Try:  sudo ./install.sh"
    exit 1
fi

# ── 2. Ubuntu version check ──────────────────────────────────────
if ! command -v lsb_release &>/dev/null; then
    error "lsb_release not found. Is this Ubuntu?"
    exit 1
fi

DISTRIB=$(lsb_release -is 2>/dev/null)
VERSION=$(lsb_release -rs 2>/dev/null)
MAJOR=$(echo "$VERSION" | cut -d. -f1)
MINOR=$(echo "$VERSION" | cut -d. -f2)

if [ "$DISTRIB" != "Ubuntu" ]; then
    error "This installer requires Ubuntu. Detected: $DISTRIB"
    exit 1
fi

if [ "$MAJOR" -lt 20 ] || { [ "$MAJOR" -eq 20 ] && [ "$MINOR" -lt 4 ]; }; then
    error "Ubuntu 20.04 or later is required. Detected: $VERSION"
    exit 1
fi

info "Detected Ubuntu $VERSION — OK"

# ── 3. Install system dependencies ──────────────────────────────
info "Updating package lists…"
apt-get update -qq

info "Installing system packages…"
PACKAGES=(
    python3
    python3-pip
    python3-pyqt5
    python3-pyqt5.qtsvg
    python3-requests
    vlc
    libvlc-dev
    libvlc5
)

# libvlccore package name differs across Ubuntu versions
if apt-cache show libvlccore9 &>/dev/null 2>&1; then
    PACKAGES+=(libvlccore9)
fi

apt-get install -y "${PACKAGES[@]}" 2>&1 | grep -E "(Installing|already installed|E:)" || true
success "System packages installed"

# ── 4. Install python-vlc via pip ────────────────────────────────
info "Installing python-vlc Python bindings…"
# Try apt first (available as python3-vlc on some Ubuntu versions)
if apt-cache show python3-vlc &>/dev/null 2>&1; then
    apt-get install -y python3-vlc 2>/dev/null || pip3 install --quiet python-vlc
else
    pip3 install --quiet python-vlc
fi
success "python-vlc installed"

# ── 5. Determine source directory ────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="/opt/radio-player"

info "Installing Radio Player to $INSTALL_DIR…"

# ── 6. Copy files ────────────────────────────────────────────────
mkdir -p "$INSTALL_DIR"
cp -r "$SCRIPT_DIR/src"          "$INSTALL_DIR/"
cp -r "$SCRIPT_DIR/assets"       "$INSTALL_DIR/"
cp    "$SCRIPT_DIR/radio_player.py"   "$INSTALL_DIR/"
cp    "$SCRIPT_DIR/requirements.txt"  "$INSTALL_DIR/"
cp    "$SCRIPT_DIR/uninstall.sh"      "$INSTALL_DIR/"
chmod +x "$INSTALL_DIR/uninstall.sh"

# Set ownership and permissions
chown -R root:root "$INSTALL_DIR"
chmod -R 755 "$INSTALL_DIR"
find "$INSTALL_DIR" -name "*.py" -exec chmod 644 {} \;
chmod 755 "$INSTALL_DIR/radio_player.py"
success "Files copied to $INSTALL_DIR"

# ── 7. Create launcher script ────────────────────────────────────
cat > /usr/local/bin/radio-player << 'EOF'
#!/bin/bash
exec python3 /opt/radio-player/radio_player.py "$@"
EOF
chmod +x /usr/local/bin/radio-player
success "Launcher created at /usr/local/bin/radio-player"

# ── 8. Install desktop entry ─────────────────────────────────────
cp "$SCRIPT_DIR/radio-player.desktop" /usr/share/applications/radio-player.desktop
chmod 644 /usr/share/applications/radio-player.desktop

if command -v update-desktop-database &>/dev/null; then
    update-desktop-database /usr/share/applications 2>/dev/null || true
fi
success "Desktop entry installed"

# ── 9. Create uninstall symlink ──────────────────────────────────
ln -sf /opt/radio-player/uninstall.sh /usr/local/bin/radio-player-uninstall
chmod +x /usr/local/bin/radio-player-uninstall

# ── 10. Verify import works ──────────────────────────────────────
info "Verifying installation…"
if python3 -c "import PyQt5, vlc, requests; print('Dependencies OK')" 2>/dev/null; then
    success "All Python dependencies verified"
else
    warn "Could not verify all dependencies. The app may still work."
    warn "Try running: python3 -c \"import PyQt5, vlc, requests\""
fi

# ── Done ─────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Radio Player installed successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "  Launch from terminal:  radio-player"
echo "  Or find it in your application menu."
echo ""
echo "  To uninstall:  sudo radio-player-uninstall"
echo ""
