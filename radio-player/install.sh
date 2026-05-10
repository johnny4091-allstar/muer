#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
#  Radio Player — Installer for Ubuntu 20.04+ (headless server)
#  Usage: sudo ./install.sh
#  Opens port 5000. Access from your browser at http://<server-ip>:5000
# ─────────────────────────────────────────────────────────────────
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

info()    { echo -e "${CYAN}[INFO]${NC} $*"; }
success() { echo -e "${GREEN}[OK]${NC}   $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*" >&2; }

INSTALL_DIR="/opt/radio-player"
SERVICE_USER="radio-player"
PORT=5000

# ── 1. Root check ────────────────────────────────────────────────
if [ "$EUID" -ne 0 ]; then
    error "Run as root:  sudo ./install.sh"
    exit 1
fi

echo ""
echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}${CYAN}         Radio Player — Server Installer              ${NC}"
echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ── 2. Ubuntu check ──────────────────────────────────────────────
if ! command -v lsb_release &>/dev/null; then
    info "Installing lsb-release…"
    apt-get install -y -qq lsb-release
fi

DISTRIB=$(lsb_release -is 2>/dev/null)
VERSION=$(lsb_release -rs 2>/dev/null)
MAJOR=$(echo "$VERSION" | cut -d. -f1)

if [ "$DISTRIB" != "Ubuntu" ] || [ "$MAJOR" -lt 20 ]; then
    error "Ubuntu 20.04+ required. Detected: $DISTRIB $VERSION"
    exit 1
fi
info "Detected Ubuntu $VERSION — OK"

# ── 3. Install system packages ───────────────────────────────────
info "Updating package lists…"
apt-get update -qq

info "Installing Python3 and pip…"
apt-get install -y -qq python3 python3-pip python3-venv curl
success "System packages ready"

# ── 4. Install Python dependencies ──────────────────────────────
info "Installing Flask and requests…"
pip3 install --quiet --upgrade flask requests
success "Python packages installed"

# ── 5. Create service user ───────────────────────────────────────
if ! id "$SERVICE_USER" &>/dev/null; then
    useradd --system --no-create-home --shell /usr/sbin/nologin "$SERVICE_USER"
    info "Created system user: $SERVICE_USER"
fi

# Create config dir for favorites
CONFIG_DIR="/home/$SERVICE_USER/.config/radio-player"
mkdir -p "$CONFIG_DIR"
chown -R "$SERVICE_USER:$SERVICE_USER" "$CONFIG_DIR" 2>/dev/null || true

# ── 6. Copy application files ────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
info "Installing to $INSTALL_DIR…"

mkdir -p "$INSTALL_DIR"
cp    "$SCRIPT_DIR/server.py"           "$INSTALL_DIR/"
cp    "$SCRIPT_DIR/requirements.txt"    "$INSTALL_DIR/"
cp    "$SCRIPT_DIR/uninstall.sh"        "$INSTALL_DIR/"
cp -r "$SCRIPT_DIR/static"             "$INSTALL_DIR/"
cp -r "$SCRIPT_DIR/templates"          "$INSTALL_DIR/"

chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR"
chmod -R 755 "$INSTALL_DIR"
find "$INSTALL_DIR" -name "*.py" -exec chmod 644 {} \;
chmod 755 "$INSTALL_DIR/uninstall.sh"
success "Files installed to $INSTALL_DIR"

# ── 7. Install systemd service ───────────────────────────────────
info "Installing systemd service…"
cp "$SCRIPT_DIR/radio-player.service" /etc/systemd/system/radio-player.service

# Set the correct home path for config in service file
HOME_DIR=$(eval echo "~$SERVICE_USER" 2>/dev/null || echo "/var/lib/$SERVICE_USER")
# Patch service file to use correct path
sed -i "s|ReadWritePaths=.*|ReadWritePaths=$CONFIG_DIR|" /etc/systemd/system/radio-player.service

systemctl daemon-reload
systemctl enable radio-player
systemctl restart radio-player
success "Systemd service installed and started"

# ── 8. Detect server IP ──────────────────────────────────────────
SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "<your-server-ip>")

# ── 9. Firewall hint ─────────────────────────────────────────────
if command -v ufw &>/dev/null; then
    UFW_STATUS=$(ufw status 2>/dev/null | head -1)
    if echo "$UFW_STATUS" | grep -q "active"; then
        info "Opening port $PORT in UFW firewall…"
        ufw allow "$PORT/tcp" comment "Radio Player" >/dev/null
        success "Port $PORT opened in UFW"
    fi
fi

# ── 10. Wait and verify ──────────────────────────────────────────
sleep 2
if systemctl is-active --quiet radio-player; then
    success "Service is running"
else
    warn "Service may not have started — check:  journalctl -u radio-player -n 20"
fi

# ── Done ─────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Radio Player installed and running!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  Open in your browser:  ${BOLD}http://${SERVER_IP}:${PORT}${NC}"
echo ""
echo "  Service commands:"
echo "    sudo systemctl status  radio-player"
echo "    sudo systemctl restart radio-player"
echo "    sudo journalctl -u radio-player -f"
echo ""
echo "  To uninstall:  sudo /opt/radio-player/uninstall.sh"
echo ""
