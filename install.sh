#!/bin/bash

#####################################################################
# IPTV Management Panel - VPS Installation Script
# For Ubuntu/Debian-based systems
# This script installs and configures the complete IPTV panel
#####################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="iptv-panel"
APP_DIR="/var/www/${APP_NAME}"
NGINX_CONF="/etc/nginx/sites-available/${APP_NAME}"
NGINX_ENABLED="/etc/nginx/sites-enabled/${APP_NAME}"
NODE_VERSION="20"

#####################################################################
# Helper Functions
#####################################################################

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "This script must be run as root or with sudo"
        exit 1
    fi
}

get_server_ip() {
    # Force IPv4 address detection only
    SERVER_IP=$(curl -4 -s ifconfig.me 2>/dev/null || curl -4 -s icanhazip.com 2>/dev/null || ip -4 addr show | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v '127.0.0.1' | head -n1)
    if [ -z "$SERVER_IP" ]; then
        SERVER_IP="localhost"
    fi
    echo "$SERVER_IP"
}

#####################################################################
# Installation Steps
#####################################################################

install_system_dependencies() {
    print_info "Updating system packages..."
    apt update -y

    print_info "Installing system dependencies..."
    apt install -y \
        curl \
        wget \
        git \
        build-essential \
        nginx \
        sqlite3 \
        ufw \
        certbot \
        python3-certbot-nginx

    print_success "System dependencies installed"
}

install_nodejs() {
    print_info "Installing Node.js ${NODE_VERSION}.x..."

    # Check if Node.js is already installed
    if command -v node &> /dev/null; then
        NODE_CURRENT=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_CURRENT" -ge "$NODE_VERSION" ]; then
            print_success "Node.js $(node -v) is already installed"
            return
        fi
    fi

    # Install Node.js from NodeSource
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt install -y nodejs

    print_success "Node.js $(node -v) installed"
    print_success "npm $(npm -v) installed"
}

install_pm2() {
    print_info "Installing PM2 process manager..."

    if command -v pm2 &> /dev/null; then
        print_success "PM2 is already installed"
        return
    fi

    npm install -g pm2

    # Configure PM2 to start on boot
    pm2 startup systemd -u root --hp /root

    print_success "PM2 installed and configured for auto-start"
}

create_application_directory() {
    print_info "Creating application directory..."

    if [ -d "$APP_DIR" ]; then
        print_warning "Application directory already exists. Backing up..."
        mv "$APP_DIR" "${APP_DIR}.backup.$(date +%s)"
    fi

    mkdir -p "$APP_DIR"
    cd "$APP_DIR"

    print_success "Application directory created at $APP_DIR"
}

clone_repository() {
    print_info "Cloning repository..."

    # Clone the specific branch
    git clone -b claude/iptv-management-panel-SrHfM https://github.com/johnny4091-allstar/muer.git temp_clone

    # Copy IPTV backend files from subdirectory
    if [ -d "temp_clone/iptv-backend" ]; then
        print_info "Copying files from iptv-backend directory..."
        # Use rsync or cp with proper flags to copy everything including hidden files
        cp -r temp_clone/iptv-backend/. "$APP_DIR/"
    else
        print_info "Copying files from root directory..."
        cp -r temp_clone/. "$APP_DIR/"
    fi

    # Clean up temp directory
    rm -rf temp_clone

    # Verify critical files exist
    if [ ! -f "$APP_DIR/package.json" ]; then
        print_error "package.json not found after clone!"
        exit 1
    fi

    if [ ! -f "$APP_DIR/server.js" ]; then
        print_error "server.js not found after clone!"
        exit 1
    fi

    print_success "Repository cloned successfully"
}

install_npm_dependencies() {
    print_info "Installing npm dependencies..."

    cd "$APP_DIR"
    npm install --production

    print_success "Dependencies installed"
}

initialize_database() {
    print_info "Initializing database..."

    cd "$APP_DIR"

    # Verify the init script exists
    if [ ! -f "scripts/init-db.js" ]; then
        print_error "Database initialization script not found!"
        print_error "Expected: $APP_DIR/scripts/init-db.js"
        print_info "Listing directory contents:"
        ls -la "$APP_DIR/"
        exit 1
    fi

    # Run the initialization script
    node scripts/init-db.js

    print_success "Database initialized"
}

create_env_file() {
    print_info "Creating environment configuration..."

    SERVER_IP=$(get_server_ip)

    cat > "$APP_DIR/.env" << EOF
# IPTV Panel Configuration
NODE_ENV=production
PORT=3000

# Server Configuration
IPTV_SERVER_URL=http://${SERVER_IP}
IPTV_SERVER_PORT=80

# Database
DATABASE_PATH=/var/www/iptv-panel/data/database.sqlite

# Admin Credentials (CHANGE THESE!)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# Session Secret (auto-generated)
SESSION_SECRET=$(openssl rand -hex 32)

# API Configuration
API_ENABLED=true
ALLOW_REGISTRATION=false

# Logging
LOG_LEVEL=info
LOG_FILE=/var/www/iptv-panel/logs/app.log
EOF

    print_success "Environment file created"
    print_warning "IMPORTANT: Change default admin credentials in $APP_DIR/.env"
}

setup_database() {
    print_info "Setting up database..."

    mkdir -p "$APP_DIR/data"
    mkdir -p "$APP_DIR/logs"

    # Initialize database if it doesn't exist
    if [ ! -f "$APP_DIR/data/database.sqlite" ]; then
        touch "$APP_DIR/data/database.sqlite"
        print_success "Database file created"
    else
        print_success "Database already exists"
    fi
}

configure_nginx() {
    print_info "Configuring Nginx..."

    SERVER_IP=$(get_server_ip)

    cat > "$NGINX_CONF" << 'EOF'
upstream iptv_backend {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;

    server_name _;

    client_max_body_size 100M;

    # Logging
    access_log /var/log/nginx/iptv-panel.access.log;
    error_log /var/log/nginx/iptv-panel.error.log;

    # Disable automatic HTTPS redirects
    port_in_redirect off;
    absolute_redirect off;

    # Root location - proxy to Node.js
    location / {
        proxy_pass http://iptv_backend;
        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto http;

        proxy_cache_bypass $http_upgrade;
        proxy_redirect off;

        # Disable any redirects to HTTPS
        proxy_redirect https:// http://;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://iptv_backend;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

    # Enable site
    ln -sf "$NGINX_CONF" "$NGINX_ENABLED"

    # Remove default site
    rm -f /etc/nginx/sites-enabled/default

    # Test configuration
    nginx -t

    # Restart Nginx
    systemctl restart nginx
    systemctl enable nginx

    print_success "Nginx configured and started"
}

start_application() {
    print_info "Starting application with PM2..."

    cd "$APP_DIR"

    # Stop existing process if any
    pm2 delete $APP_NAME 2>/dev/null || true

    # Start application
    pm2 start npm --name "$APP_NAME" -- start

    # Save PM2 process list
    pm2 save

    print_success "Application started with PM2"
}

configure_firewall() {
    print_info "Configuring firewall..."

    # Check if UFW is active
    if ufw status | grep -q "Status: active"; then
        print_info "UFW is already active"
    else
        # Enable UFW with default rules
        ufw --force enable
    fi

    # Allow SSH, HTTP, HTTPS
    ufw allow 22/tcp comment 'SSH'
    ufw allow 80/tcp comment 'HTTP'
    ufw allow 443/tcp comment 'HTTPS'

    print_success "Firewall configured"
}

create_systemd_service() {
    print_info "Creating systemd service..."

    cat > /etc/systemd/system/iptv-panel.service << EOF
[Unit]
Description=IPTV Management Panel
After=network.target

[Service]
Type=forking
User=root
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/pm2 start $APP_DIR/npm --name $APP_NAME -- start
ExecReload=/usr/bin/pm2 reload $APP_NAME
ExecStop=/usr/bin/pm2 stop $APP_NAME
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable iptv-panel.service

    print_success "Systemd service created"
}

print_installation_summary() {
    SERVER_IP=$(get_server_ip)

    echo ""
    echo "=========================================================================="
    echo -e "${GREEN}  IPTV Management Panel - Installation Complete!${NC}"
    echo "=========================================================================="
    echo ""
    echo -e "${YELLOW}📍 Access Information:${NC}"
    echo "   Admin Panel:     http://${SERVER_IP}/admin"
    echo "   API Endpoint:    http://${SERVER_IP}/player_api.php"
    echo ""
    echo -e "${YELLOW}🔐 Default Credentials:${NC}"
    echo "   Username: admin"
    echo "   Password: admin123"
    echo -e "   ${RED}⚠️  CHANGE THESE IMMEDIATELY!${NC}"
    echo ""
    echo -e "${YELLOW}📂 Important Paths:${NC}"
    echo "   Application:     $APP_DIR"
    echo "   Configuration:   $APP_DIR/.env"
    echo "   Database:        $APP_DIR/data/database.sqlite"
    echo "   Logs:            $APP_DIR/logs/"
    echo "   Nginx Config:    $NGINX_CONF"
    echo ""
    echo -e "${YELLOW}🔧 Management Commands:${NC}"
    echo "   View logs:       pm2 logs $APP_NAME"
    echo "   Restart app:     pm2 restart $APP_NAME"
    echo "   Stop app:        pm2 stop $APP_NAME"
    echo "   App status:      pm2 status"
    echo "   Restart Nginx:   systemctl restart nginx"
    echo ""
    echo -e "${YELLOW}🔒 Security Next Steps:${NC}"
    echo "   1. Change admin password in /admin/settings"
    echo "   2. Update .env file with secure credentials"
    echo "   3. Configure domain and SSL certificate:"
    echo "      certbot --nginx -d yourdomain.com"
    echo "   4. Review firewall rules: ufw status"
    echo ""
    echo -e "${YELLOW}📱 Client Configuration (Xtream Codes API):${NC}"
    echo "   Server URL:  http://${SERVER_IP}"
    echo "   Port:        80"
    echo "   Username:    (create in admin panel)"
    echo "   Password:    (create in admin panel)"
    echo ""
    echo -e "${YELLOW}🌐 API Endpoints:${NC}"
    echo "   Player API:  http://${SERVER_IP}/player_api.php?username=USER&password=PASS"
    echo "   M3U Playlist: http://${SERVER_IP}/get.php?username=USER&password=PASS"
    echo "   EPG XML:     http://${SERVER_IP}/xmltv.php?username=USER&password=PASS"
    echo ""
    echo "=========================================================================="
    echo -e "${GREEN}  Installation completed successfully!${NC}"
    echo "=========================================================================="
    echo ""
}

#####################################################################
# Main Installation Flow
#####################################################################

main() {
    clear
    echo "=========================================================================="
    echo "  IPTV Management Panel - VPS Installation"
    echo "=========================================================================="
    echo ""

    check_root

    print_info "Starting installation..."
    echo ""

    install_system_dependencies
    install_nodejs
    install_pm2
    create_application_directory
    clone_repository
    install_npm_dependencies
    create_env_file
    setup_database
    initialize_database
    configure_nginx
    start_application
    configure_firewall
    create_systemd_service

    print_installation_summary
}

# Run main function
main
