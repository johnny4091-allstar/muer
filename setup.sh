#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  Muer – Ubuntu server setup script
#  Run once on a fresh Ubuntu 20.04/22.04/24.04 machine.
#  Usage: bash setup.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

info()    { echo -e "${GREEN}[muer]${NC} $*"; }
warn()    { echo -e "${YELLOW}[warn]${NC} $*"; }
error()   { echo -e "${RED}[error]${NC} $*"; exit 1; }
divider() { echo -e "\n${BOLD}────────────────────────────────────────${NC}"; }

divider
echo -e "${BOLD}  Muer – YouTube Music Clone${NC}"
echo    "  Ubuntu server setup"
divider

# ─── 1. Node.js 18 ───────────────────────────────────────────────────────────
if ! command -v node &>/dev/null || [[ "$(node -e 'process.stdout.write(process.version.slice(1).split(".")[0])')" -lt 18 ]]; then
  info "Installing Node.js 18 via NodeSource…"
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt-get install -y nodejs
else
  info "Node.js $(node --version) already installed — skipping."
fi

# ─── 2. PM2 ──────────────────────────────────────────────────────────────────
if ! command -v pm2 &>/dev/null; then
  info "Installing PM2 globally…"
  sudo npm install -g pm2
else
  info "PM2 $(pm2 --version) already installed — skipping."
fi

# ─── 3. Git ──────────────────────────────────────────────────────────────────
if ! command -v git &>/dev/null; then
  info "Installing git…"
  sudo apt-get install -y git
fi

# ─── 4. .env ─────────────────────────────────────────────────────────────────
divider
if [ ! -f .env ]; then
  info "Creating .env from .env.sample…"
  cp .env.sample .env
  warn "Please edit .env and fill in your values before continuing."
  warn "Required: YOUTUBE_API_KEY, ADMIN_PASSWORD, SESSION_SECRET"
  echo ""
  read -r -p "  Press ENTER once you have edited .env…"
else
  info ".env already exists — skipping copy."
fi

# Verify required vars are set
source .env 2>/dev/null || true
[[ -z "${YOUTUBE_API_KEY:-}" ]]  && error "YOUTUBE_API_KEY is not set in .env"
[[ -z "${ADMIN_PASSWORD:-}" ]]   && error "ADMIN_PASSWORD is not set in .env"
[[ -z "${SESSION_SECRET:-}" ]]   && error "SESSION_SECRET is not set in .env"
info "Environment variables look good."

# ─── 5. Dependencies ─────────────────────────────────────────────────────────
divider
info "Installing npm dependencies…"
npm install

# ─── 6. Build ────────────────────────────────────────────────────────────────
divider
info "Building app (self-host mode)…"
npm run build:selfhost

# ─── 7. Logs dir ─────────────────────────────────────────────────────────────
mkdir -p logs

# ─── 8. PM2 start ────────────────────────────────────────────────────────────
divider
info "Starting app with PM2…"
pm2 start ecosystem.config.js

# ─── 9. PM2 save + startup ───────────────────────────────────────────────────
pm2 save

info "Generating PM2 startup script (auto-start on reboot)…"
# Print the command the user needs to run with sudo
STARTUP_CMD=$(pm2 startup | tail -1)
if [[ "$STARTUP_CMD" == sudo* ]]; then
  echo ""
  warn "Run the following command to enable auto-start on reboot:"
  echo -e "  ${BOLD}${STARTUP_CMD}${NC}"
  echo ""
fi

# ─── Done ─────────────────────────────────────────────────────────────────────
divider
echo ""
echo -e "${GREEN}${BOLD}  Setup complete!${NC}"
echo ""
echo    "  App is running at:  http://$(hostname -I | awk '{print $1}'):3000"
echo    "  Admin panel:        http://$(hostname -I | awk '{print $1}'):3000/admin"
echo ""
echo    "  PM2 commands:"
echo    "    pm2 status          – show running processes"
echo    "    pm2 logs muer       – tail live logs"
echo    "    pm2 restart muer    – restart the server"
echo    "    pm2 stop muer       – stop the server"
echo ""
echo    "  To expose port 3000 publicly, either:"
echo    "    • Open port 3000 in your firewall/security group, OR"
echo    "    • Set up nginx/caddy as a reverse proxy to port 3000"
divider
