#!/bin/bash

###############################################################################
# IPTV Management Panel - Ubuntu 20.04 Automated Installation Script
#
# Run as root or with sudo:
#   sudo bash install-ubuntu.sh
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; }

# Banner
echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║        IPTV Management Panel Installer                   ║
║        Ubuntu 20.04 LTS                                  ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# ── Must run as root ─────────────────────────────────────────────────────────
if [ "$EUID" -ne 0 ]; then
    log_error "This script must be run as root."
    echo "  Run:  sudo bash install-ubuntu.sh"
    exit 1
fi

# When invoked via sudo, use the real user's home; otherwise fall back to /root
REAL_USER="${SUDO_USER:-root}"
REAL_HOME=$(eval echo "~$REAL_USER")
INSTALL_DIR="/var/www/iptv-panel"

log_info "Installing as root, app will be owned by: $REAL_USER"

# ── 1. System update ─────────────────────────────────────────────────────────
log_info "Step 1/10: Updating system packages..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq
log_success "System updated"

# ── 2. Install curl & git ────────────────────────────────────────────────────
log_info "Step 2/10: Installing curl, git..."
apt-get install -y -qq curl git
log_success "curl & git ready"

# ── 3. Install Node.js 18.x ──────────────────────────────────────────────────
log_info "Step 3/10: Installing Node.js 18.x..."
if ! command -v node &>/dev/null || [[ "$(node -e 'process.stdout.write(process.version.split(\".\")[0].slice(1))')" -lt 18 ]]; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    log_success "Node.js $(node --version) installed"
else
    log_success "Node.js $(node --version) already installed"
fi

# ── 4. Install PostgreSQL ────────────────────────────────────────────────────
log_info "Step 4/10: Installing PostgreSQL..."
if ! command -v psql &>/dev/null; then
    apt-get install -y postgresql postgresql-contrib
fi
systemctl start postgresql
systemctl enable postgresql
log_success "PostgreSQL ready"

# ── 5. Install PM2 ───────────────────────────────────────────────────────────
log_info "Step 5/10: Installing PM2..."
npm install -g pm2 --quiet
log_success "PM2 $(pm2 --version) installed"

# ── 6. Database setup ────────────────────────────────────────────────────────
log_info "Step 6/10: Setting up PostgreSQL database..."
echo
echo "Enter a password for the IPTV database user [iptv_admin]:"
read -r -s DB_PASSWORD
echo

# Validate password is not empty
if [ -z "$DB_PASSWORD" ]; then
    log_error "Password cannot be empty."
    exit 1
fi

# Create db / user (idempotent)
sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'iptv_admin') THEN
    CREATE USER iptv_admin WITH PASSWORD '$DB_PASSWORD';
  ELSE
    ALTER USER iptv_admin WITH PASSWORD '$DB_PASSWORD';
  END IF;
END
\$\$;

SELECT 'CREATE DATABASE iptv_panel OWNER iptv_admin'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'iptv_panel')\gexec

GRANT ALL PRIVILEGES ON DATABASE iptv_panel TO iptv_admin;
SQL

log_success "Database ready"

# ── 7. Copy / clone application ───────────────────────────────────────────────
log_info "Step 7/10: Setting up application files..."
if [ -d "$INSTALL_DIR" ]; then
    log_warning "Backing up existing installation..."
    mv "$INSTALL_DIR" "${INSTALL_DIR}.bak.$(date +%Y%m%d_%H%M%S)"
fi

mkdir -p /var/www

# Prefer copying from the local checkout if it exists
LOCAL_REPO="$(dirname "$(realpath "$0")")"
if [ -f "$LOCAL_REPO/package.json" ]; then
    log_info "Copying from local repository ($LOCAL_REPO)..."
    cp -r "$LOCAL_REPO" "$INSTALL_DIR"
else
    log_info "Cloning from GitHub..."
    git clone https://github.com/johnny4091-allstar/muer.git "$INSTALL_DIR"
fi

chown -R "$REAL_USER":"$REAL_USER" "$INSTALL_DIR"
log_success "Files ready at $INSTALL_DIR"

# ── 8. npm install & build ────────────────────────────────────────────────────
log_info "Step 8/10: Installing npm dependencies..."
cd "$INSTALL_DIR"
sudo -u "$REAL_USER" npm install --prefer-offline 2>&1 | tail -5

log_info "Building application..."
sudo -u "$REAL_USER" npm run build
log_success "Application built"

# ── 9. Load database schema ───────────────────────────────────────────────────
log_info "Step 9/10: Importing database schema..."
if [ -f "$INSTALL_DIR/database-schema.sql" ]; then
    PGPASSWORD="$DB_PASSWORD" psql -U iptv_admin -d iptv_panel -h 127.0.0.1 \
        -f "$INSTALL_DIR/database-schema.sql" -q
    log_success "Schema imported"
else
    log_warning "database-schema.sql not found — skipping"
fi

# ── 10. Write .env & start app ────────────────────────────────────────────────
log_info "Step 10/10: Writing .env and starting app..."
SESSION_SECRET=$(node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))")

cat > "$INSTALL_DIR/.env" <<ENV
# ── Database ─────────────────────────────────────────────────────
DATABASE_URL="postgresql://iptv_admin:${DB_PASSWORD}@127.0.0.1:5432/iptv_panel"

# ── Session ──────────────────────────────────────────────────────
SESSION_SECRET="${SESSION_SECRET}"

# ── Supabase (optional – fill in if you use Supabase) ───────────
SUPABASE_URL=""
SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_KEY=""

# ── Server ───────────────────────────────────────────────────────
PORT=3000
NODE_ENV=production
ENV

chown "$REAL_USER":"$REAL_USER" "$INSTALL_DIR/.env"
chmod 600 "$INSTALL_DIR/.env"

# Start with PM2 as the real user
sudo -u "$REAL_USER" bash -c "
  cd $INSTALL_DIR
  pm2 delete iptv-panel 2>/dev/null || true
  pm2 start npm --name iptv-panel -- run selfhost
  pm2 save
"

# Enable PM2 on boot for the real user
env PATH="$PATH:/usr/bin" pm2 startup systemd -u "$REAL_USER" --hp "$REAL_HOME" | tail -1 | bash
log_success "Application started with PM2"

# ── Optional: Nginx ──────────────────────────────────────────────────────────
echo
read -r -p "Install Nginx reverse proxy? (y/n): " NGINX_REPLY
if [[ "$NGINX_REPLY" =~ ^[Yy]$ ]]; then
    apt-get install -y nginx

    read -r -p "Domain name (leave blank to use server IP): " DOMAIN_NAME
    [ -z "$DOMAIN_NAME" ] && DOMAIN_NAME="_"

    cat > /etc/nginx/sites-available/iptv-panel <<NGINX
server {
    listen 80;
    server_name ${DOMAIN_NAME};

    client_max_body_size 100M;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade \$http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
    }
}
NGINX

    ln -sf /etc/nginx/sites-available/iptv-panel /etc/nginx/sites-enabled/iptv-panel
    rm -f /etc/nginx/sites-enabled/default
    nginx -t && systemctl restart nginx
    log_success "Nginx configured"

    # Firewall
    ufw allow OpenSSH
    ufw allow 'Nginx Full'
    ufw --force enable
    log_success "Firewall configured"
fi

# ── Done ─────────────────────────────────────────────────────────────────────
SERVER_IP=$(hostname -I | awk '{print $1}')
if command -v nginx &>/dev/null && [[ "$NGINX_REPLY" =~ ^[Yy]$ ]]; then
    BASE_URL="http://${DOMAIN_NAME:-$SERVER_IP}"
else
    BASE_URL="http://$SERVER_IP:3000"
fi

echo
echo -e "${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║          Installation Complete! 🎉                       ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "  Admin Panel   →  ${BLUE}${BASE_URL}/admin${NC}"
echo -e "  User Panel    →  ${BLUE}${BASE_URL}/dashboard${NC}"
echo -e "  Live TV       →  ${BLUE}${BASE_URL}/live${NC}"
echo
echo -e "  Default login: admin / ${RED}admin123  ← change this!${NC}"
echo
echo -e "  pm2 logs iptv-panel     # view logs"
echo -e "  pm2 restart iptv-panel  # restart"
echo
