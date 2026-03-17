#!/usr/bin/env bash
# =============================================================================
# Muer Voice Assistant — Installer
#
# Usage:
#   sudo bash deploy/install.sh
#   sudo bash deploy/install.sh --dir /opt/muer-assistant --user ubuntu
#   sudo bash deploy/install.sh --headless    # skip audio, text-mode only
#   sudo bash deploy/install.sh --quiet       # non-interactive, use defaults
#
# Supports: Ubuntu 20.04, 22.04, 24.04
# =============================================================================

set -euo pipefail

# ── Defaults ──────────────────────────────────────────────────────────────────
INSTALL_DIR="/opt/muer-assistant"
SERVICE_USER="${SUDO_USER:-$(logname 2>/dev/null || echo ubuntu)}"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HEADLESS=false
QUIET=false

# ── Colours ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "${CYAN}▶${RESET} $*"; }
success() { echo -e "${GREEN}✓${RESET} $*"; }
warn()    { echo -e "${YELLOW}⚠${RESET} $*"; }
error()   { echo -e "${RED}✗${RESET} $*" >&2; }
header()  { echo -e "\n${BOLD}${CYAN}━━━ $* ━━━${RESET}\n"; }

# ── Arg parsing ───────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
    case $1 in
        --user)     SERVICE_USER="$2"; shift 2 ;;
        --dir)      INSTALL_DIR="$2";  shift 2 ;;
        --headless) HEADLESS=true;     shift   ;;
        --quiet)    QUIET=true;        shift   ;;
        --key)      ANTHROPIC_API_KEY="$2"; shift 2 ;;
        -h|--help)
            echo "Usage: sudo bash install.sh [--user USER] [--dir DIR] [--headless] [--quiet] [--key ANTHROPIC_API_KEY]"
            exit 0 ;;
        *) error "Unknown argument: $1"; exit 1 ;;
    esac
done

# ── Root check ────────────────────────────────────────────────────────────────
if [[ $EUID -ne 0 ]]; then
    error "Run with sudo:  sudo bash deploy/install.sh"
    exit 1
fi

UBUNTU_VER=$(lsb_release -rs 2>/dev/null || echo "22.04")

echo -e "${BOLD}"
echo "╔══════════════════════════════════════════╗"
echo "║        Muer Voice Assistant              ║"
echo "║        Installer                         ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${RESET}"
info "Ubuntu $UBUNTU_VER  |  Install dir: $INSTALL_DIR  |  Service user: $SERVICE_USER"
[[ $HEADLESS == true ]] && warn "Headless mode — audio input disabled, text mode only."
echo ""

# ── Prompt for API keys ───────────────────────────────────────────────────────
ANTHROPIC_API_KEY=""
OWM_API_KEY=""
NEWS_API_KEY=""
DEFAULT_CITY="New York"
HA_URL=""
HA_TOKEN=""

if [[ $QUIET == false ]]; then
    header "Configuration"
    echo "  Press Enter to skip optional values."
    echo ""

    if [[ -z "$ANTHROPIC_API_KEY" ]]; then
        read -rp "  Anthropic API key (required — https://console.anthropic.com): " ANTHROPIC_API_KEY
        while [[ -z "$ANTHROPIC_API_KEY" ]]; do
            warn "Anthropic API key is required for smart responses."
            read -rp "  Anthropic API key: " ANTHROPIC_API_KEY
        done
    else
        info "Anthropic API key provided — skipping prompt."
    fi

    read -rp "  OpenWeatherMap API key (optional — https://openweathermap.org/api): " OWM_API_KEY
    read -rp "  Default weather city [New York]: " input_city
    DEFAULT_CITY="${input_city:-New York}"

    read -rp "  News API key (optional — https://newsapi.org, BBC RSS used if blank): " NEWS_API_KEY
    read -rp "  Home Assistant URL (optional — e.g. http://192.168.1.10:8123): " HA_URL
    if [[ -n "$HA_URL" ]]; then
        read -rp "  Home Assistant long-lived token: " HA_TOKEN
    fi
    echo ""
fi

# ── System packages ───────────────────────────────────────────────────────────
header "System packages"

info "Updating apt..."
apt-get update -qq

PKGS=(
    python3 python3-pip python3-venv python3-dev
    espeak espeak-data libespeak-dev
    mpv ffmpeg libsndfile1
    git curl wget
    xclip libnotify-bin          # clipboard + desktop notifications
    bluetooth bluez              # Bluetooth control
    portaudio19-dev              # pyaudio build dep (needed even in headless)
)

if [[ $HEADLESS == false ]]; then
    if dpkg --compare-versions "$UBUNTU_VER" ge "22.04"; then
        PKGS+=(pulseaudio-utils)
    else
        PKGS+=(pulseaudio)
    fi
fi

info "Installing: ${PKGS[*]}"
apt-get install -y "${PKGS[@]}" -qq 2>/dev/null
success "System packages installed."

# yt-dlp
if ! command -v yt-dlp &>/dev/null; then
    info "Installing yt-dlp..."
    curl -sL https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
        -o /usr/local/bin/yt-dlp
    chmod +x /usr/local/bin/yt-dlp
    success "yt-dlp installed."
else
    success "yt-dlp already installed ($(yt-dlp --version))."
fi

# ── Install directory ─────────────────────────────────────────────────────────
header "Installing files to $INSTALL_DIR"

mkdir -p "$INSTALL_DIR"

# Sync source (preserve .env if it exists)
rsync -a --exclude='.env' --exclude='__pycache__' --exclude='*.pyc' \
    "$REPO_DIR/assistant/" "$INSTALL_DIR/assistant/"
rsync -a "$REPO_DIR/deploy/" "$INSTALL_DIR/deploy/"

# Copy .git for auto-updater
if [[ ! -d "$INSTALL_DIR/.git" ]]; then
    cp -r "$REPO_DIR/.git" "$INSTALL_DIR/"
fi
git -C "$INSTALL_DIR" remote set-url origin \
    "$(git -C "$REPO_DIR" remote get-url origin 2>/dev/null || echo '')" 2>/dev/null || true

success "Source files installed."

# ── Python virtualenv ─────────────────────────────────────────────────────────
header "Python environment"

info "Creating virtualenv..."
python3 -m venv "$INSTALL_DIR/venv"
"$INSTALL_DIR/venv/bin/pip" install --upgrade pip --quiet

info "Installing Python packages (this may take a minute)..."
if [[ $HEADLESS == true ]]; then
    REQS_FILE="$INSTALL_DIR/assistant/requirements-headless.txt"
else
    REQS_FILE="$INSTALL_DIR/assistant/requirements.txt"
fi
"$INSTALL_DIR/venv/bin/pip" install -r "$REQS_FILE" --quiet
success "Python packages installed."

# ── .env file ─────────────────────────────────────────────────────────────────
header "Configuration file"

ENV_FILE="$INSTALL_DIR/.env"

if [[ ! -f "$ENV_FILE" ]]; then
    cp "$REPO_DIR/.env.sample" "$ENV_FILE"
    success "Created $ENV_FILE from template."
fi

# Write collected values
_set_env() {
    local key="$1" val="$2"
    if grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
        sed -i "s|^${key}=.*|${key}=\"${val}\"|" "$ENV_FILE"
    else
        echo "${key}=\"${val}\"" >> "$ENV_FILE"
    fi
}

[[ -n "$ANTHROPIC_API_KEY" ]] && _set_env "ANTHROPIC_API_KEY" "$ANTHROPIC_API_KEY"
[[ -n "$OWM_API_KEY" ]]       && _set_env "OPENWEATHERMAP_API_KEY" "$OWM_API_KEY"
[[ -n "$DEFAULT_CITY" ]]      && _set_env "DEFAULT_WEATHER_CITY" "$DEFAULT_CITY"
[[ -n "$NEWS_API_KEY" ]]      && _set_env "NEWS_API_KEY" "$NEWS_API_KEY"
[[ -n "$HA_URL" ]]            && _set_env "HA_URL" "$HA_URL"
[[ -n "$HA_TOKEN" ]]          && _set_env "HA_TOKEN" "$HA_TOKEN"
[[ $HEADLESS == true ]]       && _set_env "AUTO_UPDATE_ENABLED" "true"

success "Config written to $ENV_FILE"

# ── Permissions ───────────────────────────────────────────────────────────────
chown -R "$SERVICE_USER":"$SERVICE_USER" "$INSTALL_DIR"

# Add user to audio group
if ! groups "$SERVICE_USER" | grep -q '\baudio\b'; then
    usermod -aG audio "$SERVICE_USER"
    info "Added $SERVICE_USER to 'audio' group (re-login required for mic access)."
fi

# ── systemd services ──────────────────────────────────────────────────────────
header "systemd services"

# Patch service ExecStart for headless mode
MAIN_SERVICE="/etc/systemd/system/muer-assistant@.service"
cp "$INSTALL_DIR/deploy/muer-assistant.service" "$MAIN_SERVICE"

if [[ $HEADLESS == true ]]; then
    sed -i 's|assistant.main$|assistant.main --text|' "$MAIN_SERVICE"
    info "Configured for headless/text mode."
fi

cp "$INSTALL_DIR/deploy/muer-updater.service" "/etc/systemd/system/muer-updater@.service"
cp "$INSTALL_DIR/deploy/muer-updater.timer"   "/etc/systemd/system/muer-updater@.timer"

systemctl daemon-reload
systemctl enable "muer-assistant@${SERVICE_USER}"      2>/dev/null
systemctl enable "muer-updater@${SERVICE_USER}.timer"  2>/dev/null
success "systemd services enabled."

# ── Quick smoke test ──────────────────────────────────────────────────────────
header "Smoke test"

if "$INSTALL_DIR/venv/bin/python" -c "import assistant.config; import assistant.skills" 2>/dev/null; then
    success "Import check passed — all modules load correctly."
else
    warn "Import check failed — check $ENV_FILE and run:"
    warn "  $INSTALL_DIR/venv/bin/python -m assistant.main --text"
fi

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}"
echo "╔══════════════════════════════════════════╗"
echo "║   Installation complete!                 ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${RESET}"

# ── Start the service ─────────────────────────────────────────────────────────
if [[ -n "$ANTHROPIC_API_KEY" ]]; then
    info "Starting muer-assistant@${SERVICE_USER}..."
    systemctl restart "muer-assistant@${SERVICE_USER}" && \
        success "Service started." || \
        warn "Service start failed — check: journalctl -u muer-assistant@${SERVICE_USER} -n 50"
else
    warn "ANTHROPIC_API_KEY not set — service not started."
    warn "Add it to $ENV_FILE then run:"
    warn "  systemctl start muer-assistant@${SERVICE_USER}"
fi

echo ""
echo -e "${BOLD}View logs:${RESET}"
echo "  journalctl -u muer-assistant@${SERVICE_USER} -f"
echo ""
echo -e "${BOLD}Edit config:${RESET}"
echo "  nano $ENV_FILE"
echo ""
echo -e "${BOLD}Update later:${RESET}"
echo "  sudo bash $INSTALL_DIR/deploy/update.sh"
echo ""
