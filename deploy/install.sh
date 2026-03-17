#!/usr/bin/env bash
# =============================================================================
# Muer Voice Assistant — Ubuntu Installation Script
# Supports: Ubuntu 18.04, 20.04, 22.04, 24.04
# Usage: sudo bash deploy/install.sh [--user USERNAME] [--dir INSTALL_DIR]
# =============================================================================

set -euo pipefail

# --- Default config ---
INSTALL_DIR="/opt/muer-assistant"
SERVICE_USER="${SUDO_USER:-$(logname 2>/dev/null || echo ubuntu)}"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# --- Parse args ---
while [[ $# -gt 0 ]]; do
    case $1 in
        --user) SERVICE_USER="$2"; shift 2 ;;
        --dir)  INSTALL_DIR="$2";  shift 2 ;;
        *) echo "Unknown argument: $1"; exit 1 ;;
    esac
done

UBUNTU_VERSION=$(lsb_release -rs 2>/dev/null || echo "20.04")
echo ""
echo "========================================"
echo " Muer Voice Assistant Installer"
echo " Ubuntu $UBUNTU_VERSION"
echo " Install dir: $INSTALL_DIR"
echo " Service user: $SERVICE_USER"
echo "========================================"
echo ""

# --- Check root ---
if [[ $EUID -ne 0 ]]; then
    echo "Error: Please run with sudo."
    exit 1
fi

# --- System dependencies ---
echo "[1/6] Installing system dependencies..."
apt-get update -qq

COMMON_PKGS=(
    python3
    python3-pip
    python3-venv
    python3-dev
    portaudio19-dev
    espeak
    espeak-data
    libespeak-dev
    mpv
    ffmpeg
    libsndfile1
    git
    curl
)

apt-get install -y "${COMMON_PKGS[@]}" 2>/dev/null

# Ubuntu version-specific packages
if dpkg --compare-versions "$UBUNTU_VERSION" ge "22.04"; then
    # PipeWire-based systems still have PulseAudio-compatible pactl
    apt-get install -y pulseaudio-utils 2>/dev/null || true
else
    apt-get install -y pulseaudio 2>/dev/null || true
fi

# yt-dlp (YouTube downloader)
if ! command -v yt-dlp &>/dev/null; then
    echo "  Installing yt-dlp..."
    curl -sL https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
    chmod +x /usr/local/bin/yt-dlp
fi

echo "  System dependencies installed."

# --- Create install directory ---
echo "[2/6] Setting up install directory..."
mkdir -p "$INSTALL_DIR"

# Copy assistant source
cp -r "$REPO_DIR/assistant" "$INSTALL_DIR/"
echo "  Source files copied."

# --- Python virtual environment ---
echo "[3/6] Creating Python virtual environment..."
python3 -m venv "$INSTALL_DIR/venv"
"$INSTALL_DIR/venv/bin/pip" install --upgrade pip --quiet

echo "[4/6] Installing Python dependencies..."
"$INSTALL_DIR/venv/bin/pip" install -r "$INSTALL_DIR/assistant/requirements.txt" --quiet
echo "  Python dependencies installed."

# --- Environment file ---
echo "[5/6] Setting up environment configuration..."
if [[ ! -f "$INSTALL_DIR/.env" ]]; then
    cp "$REPO_DIR/.env.sample" "$INSTALL_DIR/.env"
    echo ""
    echo "  *** ACTION REQUIRED ***"
    echo "  Edit $INSTALL_DIR/.env and fill in your API keys:"
    echo "    - ANTHROPIC_API_KEY (required for smart responses)"
    echo "    - OPENWEATHERMAP_API_KEY (optional, for weather)"
    echo ""
fi

# Set ownership
chown -R "$SERVICE_USER":"$SERVICE_USER" "$INSTALL_DIR"

# --- systemd service ---
echo "[6/6] Installing systemd service..."
SERVICE_FILE="/etc/systemd/system/muer-assistant@.service"
cp "$REPO_DIR/deploy/muer-assistant.service" "$SERVICE_FILE"

systemctl daemon-reload
systemctl enable "muer-assistant@${SERVICE_USER}"

echo ""
echo "========================================"
echo " Installation complete!"
echo "========================================"
echo ""
echo " Next steps:"
echo "   1. Edit your config: nano $INSTALL_DIR/.env"
echo "   2. Start the service:"
echo "      sudo systemctl start muer-assistant@$SERVICE_USER"
echo "   3. Check status:"
echo "      sudo systemctl status muer-assistant@$SERVICE_USER"
echo "   4. View logs:"
echo "      journalctl -u muer-assistant@$SERVICE_USER -f"
echo ""
echo " Or run manually (for testing):"
echo "   cd $INSTALL_DIR && venv/bin/python -m assistant.main --text"
echo ""
