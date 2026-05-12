#!/usr/bin/env bash
# IPTV SaaS Platform — Ubuntu 20.04+ Installer
# Usage:
#   Basic (self-signed SSL):  sudo bash install.sh
#   With domain + SSL:        sudo DOMAIN=panel.yourdomain.com EMAIL=you@email.com bash install.sh

set -euo pipefail

INSTALL_DIR="/opt/iptvsaas"
REPO_URL="${REPO_URL:-https://github.com/johnny4091-allstar/muer.git}"
DOMAIN="${DOMAIN:-}"
EMAIL="${EMAIL:-}"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║       IPTV SaaS Platform — Installer         ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# Must run as root
if [[ $EUID -ne 0 ]]; then
  echo "ERROR: Run this script as root (sudo bash install.sh)"
  exit 1
fi

# 1. System prerequisites
echo "▶ Installing system dependencies..."
apt-get update -y -q
apt-get install -y -q \
  curl git unzip ufw openssl \
  ca-certificates gnupg lsb-release

# 2. Install Docker CE
if ! command -v docker &>/dev/null; then
  echo "▶ Installing Docker..."
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -y -q
  apt-get install -y -q \
    docker-ce docker-ce-cli containerd.io \
    docker-buildx-plugin docker-compose-plugin
  echo "✓ Docker installed"
else
  echo "✓ Docker already installed"
fi

# 3. Install Certbot (for SSL) + DNS pre-check
if [[ -n "$DOMAIN" ]]; then
  apt-get install -y -q certbot dnsutils
  echo "▶ Checking DNS for $DOMAIN..."
  SERVER_IP=$(curl -4 -sf --max-time 5 https://ifconfig.me || curl -4 -sf --max-time 5 https://api.ipify.org || true)
  DOMAIN_IP=$(dig +short "$DOMAIN" A 2>/dev/null | tail -1 || true)
  if [[ -z "$DOMAIN_IP" ]]; then
    echo ""
    echo "ERROR: DNS lookup for '$DOMAIN' returned no A record."
    echo "  • Make sure you've created an A record pointing '$DOMAIN' → this server's IP"
    echo "  • Then wait 5-15 minutes for DNS to propagate and re-run this script"
    echo ""
    echo "  To install without SSL (self-signed, for testing):"
    echo "    sudo bash install.sh"
    echo ""
    exit 1
  fi
  if [[ -n "$SERVER_IP" && "$DOMAIN_IP" != "$SERVER_IP" ]]; then
    echo ""
    echo "ERROR: '$DOMAIN' resolves to $DOMAIN_IP but this server's IP is $SERVER_IP."
    echo "  • Update your DNS A record to point '$DOMAIN' → $SERVER_IP"
    echo "  • Wait 5-15 minutes for propagation, then re-run."
    echo ""
    echo "  To install without SSL (self-signed, for testing):"
    echo "    sudo bash install.sh"
    echo ""
    exit 1
  fi
  echo "✓ DNS check passed ($DOMAIN → $DOMAIN_IP)"
fi

# 4. Firewall
echo "▶ Configuring firewall..."
ufw allow 22/tcp  >/dev/null
ufw allow 80/tcp  >/dev/null
ufw allow 443/tcp >/dev/null
ufw --force enable >/dev/null
echo "✓ Firewall configured (22, 80, 443)"

# 5. Clone / update repo
echo "▶ Setting up application at $INSTALL_DIR..."
if [[ -d "$INSTALL_DIR/.git" ]]; then
  git -C "$INSTALL_DIR" pull origin main
else
  git clone "$REPO_URL" "$INSTALL_DIR"
fi
cd "$INSTALL_DIR"

# 6. Generate secrets
echo "▶ Generating secrets..."
POSTGRES_PASSWORD=$(openssl rand -hex 32)
REDIS_PASSWORD=$(openssl rand -hex 32)
NEXTAUTH_SECRET=$(openssl rand -hex 32)
DEVICE_API_KEY_SALT=$(openssl rand -hex 32)
CRON_SECRET="$NEXTAUTH_SECRET"

# 7. Write .env
cat > "$INSTALL_DIR/.env" <<EOF
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
REDIS_PASSWORD=$REDIS_PASSWORD
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
NEXTAUTH_URL=https://${DOMAIN:-localhost}
DEVICE_API_KEY_SALT=$DEVICE_API_KEY_SALT
CRON_SECRET=$CRON_SECRET
EOF
chmod 600 "$INSTALL_DIR/.env"
echo "✓ Secrets written to $INSTALL_DIR/.env"

# 8. SSL certificates
mkdir -p "$INSTALL_DIR/nginx/ssl"

if [[ -n "$DOMAIN" && -n "$EMAIL" ]]; then
  echo "▶ Obtaining Let's Encrypt certificate for $DOMAIN..."
  certbot certonly --standalone --non-interactive --agree-tos \
    -m "$EMAIL" -d "$DOMAIN"
  ln -sfn "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" \
           "$INSTALL_DIR/nginx/ssl/cert.pem"
  ln -sfn "/etc/letsencrypt/live/$DOMAIN/privkey.pem" \
           "$INSTALL_DIR/nginx/ssl/key.pem"
  echo "✓ SSL certificate obtained"

  # Auto-renewal
  (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --deploy-hook 'docker compose -f $INSTALL_DIR/docker-compose.yml exec -T nginx nginx -s reload'") | crontab -
else
  echo "▶ Generating self-signed certificate (testing only)..."
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$INSTALL_DIR/nginx/ssl/key.pem" \
    -out    "$INSTALL_DIR/nginx/ssl/cert.pem" \
    -subj "/CN=localhost" 2>/dev/null
  echo "✓ Self-signed certificate created"
fi

# 9. Build and start containers
echo "▶ Building Docker images (this takes a few minutes)..."
cd "$INSTALL_DIR"
docker compose build --no-cache

echo "▶ Starting services..."
docker compose up -d

# 10. Wait for Postgres
echo "▶ Waiting for Postgres to be ready..."
RETRIES=30
until docker compose exec -T postgres pg_isready -U iptvsaas >/dev/null 2>&1 || [[ $RETRIES -eq 0 ]]; do
  printf "."
  RETRIES=$((RETRIES - 1))
  sleep 2
done
echo ""

# 11. Run migrations and seed
echo "▶ Running database migrations..."
docker compose exec -T -u root app ./node_modules/.bin/prisma migrate deploy
echo "▶ Seeding database (creating admin account)..."
docker compose exec -T -u root app ./node_modules/.bin/prisma db seed

# 12. Cron for device status + EPG refresh
echo "▶ Setting up cron job..."
(crontab -l 2>/dev/null; \
  echo "*/5 * * * * curl -sf -X POST http://localhost:3000/api/internal/cron -H 'X-Cron-Secret: $CRON_SECRET' >> /var/log/iptvsaas-cron.log 2>&1") \
  | crontab -

# 13. Done
echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║         Installation Complete! 🎉            ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "  Portal URL:    https://${DOMAIN:-localhost}/login"
echo "  Default login: admin@example.com"
echo "  Password:      changeme"
echo ""
echo "  ⚠  CHANGE THE DEFAULT PASSWORD IMMEDIATELY"
echo ""
echo "  After logging in:"
echo "  1. Go to Settings → enter your Xtream panel URL + credentials"
echo "  2. Trigger EPG refresh (or wait up to 5 minutes for cron)"
echo "  3. Open /player to verify the web player loads channels"
echo ""
echo "  Secrets are stored in: $INSTALL_DIR/.env (keep private!)"
echo ""
