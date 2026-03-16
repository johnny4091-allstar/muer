#!/bin/bash

###############################################################################
# IPTV Management Panel - Ubuntu 20.04 Automated Installation Script
# This script automates the installation process on Ubuntu 20.04 LTS
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Banner
echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║        IPTV Management Panel Installer                   ║
║        Ubuntu 20.04 LTS                                  ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    log_error "Please do not run this script as root. Run as a regular user with sudo privileges."
    exit 1
fi

# Check if running on Ubuntu
if ! grep -q "Ubuntu" /etc/os-release; then
    log_warning "This script is designed for Ubuntu 20.04. Your system may not be compatible."
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

log_info "Starting installation..."

# Step 1: Update system
log_info "Step 1/11: Updating system packages..."
sudo apt update && sudo apt upgrade -y
log_success "System updated successfully"

# Step 2: Install Node.js
log_info "Step 2/11: Installing Node.js 18.x..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
    log_success "Node.js $(node --version) installed"
else
    log_success "Node.js $(node --version) already installed"
fi

# Step 3: Install PostgreSQL
log_info "Step 3/11: Installing PostgreSQL..."
if ! command -v psql &> /dev/null; then
    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    log_success "PostgreSQL installed and started"
else
    log_success "PostgreSQL already installed"
fi

# Step 4: Install Git
log_info "Step 4/11: Installing Git..."
if ! command -v git &> /dev/null; then
    sudo apt install -y git
    log_success "Git installed"
else
    log_success "Git already installed"
fi

# Step 5: Install PM2
log_info "Step 5/11: Installing PM2 (Process Manager)..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    log_success "PM2 installed"
else
    log_success "PM2 already installed"
fi

# Step 6: Create database
log_info "Step 6/11: Setting up PostgreSQL database..."
echo
echo "Please enter a password for the IPTV database user:"
read -s DB_PASSWORD
echo

# Create database and user
sudo -u postgres psql << EOF
DROP DATABASE IF EXISTS iptv_panel;
DROP USER IF EXISTS iptv_admin;
CREATE DATABASE iptv_panel;
CREATE USER iptv_admin WITH PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE iptv_panel TO iptv_admin;
ALTER DATABASE iptv_panel OWNER TO iptv_admin;
\q
EOF

log_success "Database created successfully"

# Step 7: Install application
log_info "Step 7/11: Installing application..."
INSTALL_DIR="/var/www/iptv-panel"

if [ -d "$INSTALL_DIR" ]; then
    log_warning "Installation directory already exists. Backing up..."
    sudo mv "$INSTALL_DIR" "${INSTALL_DIR}.backup.$(date +%Y%m%d_%H%M%S)"
fi

sudo mkdir -p /var/www
cd /var/www

# Check if we're already in the repo
if [ -d "/home/$USER/muer/.git" ]; then
    log_info "Copying from local repository..."
    sudo cp -r "/home/$USER/muer" "$INSTALL_DIR"
else
    log_info "Cloning repository..."
    sudo git clone https://github.com/johnny4091-allstar/muer.git iptv-panel
fi

sudo chown -R $USER:$USER "$INSTALL_DIR"
log_success "Application installed to $INSTALL_DIR"

# Step 8: Install dependencies
log_info "Step 8/11: Installing Node.js dependencies..."
cd "$INSTALL_DIR"
npm install
log_success "Dependencies installed"

# Step 9: Set up database schema
log_info "Step 9/11: Setting up database schema..."
if [ -f "database-schema.sql" ]; then
    PGPASSWORD=$DB_PASSWORD psql -U iptv_admin -d iptv_panel -h localhost -f database-schema.sql
    log_success "Database schema created"
else
    log_warning "database-schema.sql not found. You'll need to set up the schema manually."
fi

# Step 10: Configure environment
log_info "Step 10/11: Configuring environment..."
SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

cat > .env << EOF
# Database Configuration
DATABASE_URL="postgresql://iptv_admin:$DB_PASSWORD@localhost:5432/iptv_panel"

# Session Secret
SESSION_SECRET="$SESSION_SECRET"

# Server Configuration
PORT=3000
NODE_ENV=production

# Optional: Supabase Configuration
# SUPABASE_URL="https://your-project.supabase.co"
# SUPABASE_ANON_KEY="your_supabase_anon_key"
# SUPABASE_SERVICE_KEY="your_supabase_service_key"
EOF

log_success "Environment configured"

# Step 11: Build application
log_info "Step 11/11: Building application..."
npm run build
log_success "Application built successfully"

# Start with PM2
log_info "Starting application with PM2..."
pm2 delete iptv-panel 2>/dev/null || true
pm2 start npm --name "iptv-panel" -- run selfhost
pm2 save
pm2 startup systemd -u $USER --hp /home/$USER | grep -v "PM2" | bash
log_success "Application started"

# Install Nginx (optional)
echo
read -p "Do you want to install and configure Nginx as a reverse proxy? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "Installing Nginx..."
    sudo apt install -y nginx

    echo "Enter your domain name (or press Enter to use IP address):"
    read DOMAIN_NAME

    if [ -z "$DOMAIN_NAME" ]; then
        DOMAIN_NAME="_"
    fi

    sudo tee /etc/nginx/sites-available/iptv-panel > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN_NAME;

    client_max_body_size 100M;
    proxy_buffers 16 16k;
    proxy_buffer_size 16k;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
EOF

    sudo ln -sf /etc/nginx/sites-available/iptv-panel /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo nginx -t && sudo systemctl restart nginx
    log_success "Nginx configured and started"

    # Configure firewall
    log_info "Configuring firewall..."
    sudo ufw allow OpenSSH
    sudo ufw allow 'Nginx Full'
    sudo ufw --force enable
    log_success "Firewall configured"
fi

# Installation complete
echo
echo -e "${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║        Installation Complete! 🎉                         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo
log_success "Your IPTV Management Panel is now running!"
echo
echo -e "${BLUE}Access Information:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v nginx &> /dev/null; then
    if [ "$DOMAIN_NAME" = "_" ]; then
        SERVER_IP=$(hostname -I | awk '{print $1}')
        echo "  URL: http://$SERVER_IP"
    else
        echo "  URL: http://$DOMAIN_NAME"
    fi
else
    SERVER_IP=$(hostname -I | awk '{print $1}')
    echo "  URL: http://$SERVER_IP:3000"
fi

echo
echo "  Admin Panel:     /admin"
echo "  User Dashboard:  /dashboard"
echo "  Live TV:         /live"
echo
echo "  Default Credentials:"
echo "    Username: admin"
echo "    Password: admin123"
echo
echo -e "${RED}⚠️  IMPORTANT: Change the default password immediately!${NC}"
echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo
echo -e "${BLUE}Useful Commands:${NC}"
echo "  View logs:        pm2 logs iptv-panel"
echo "  Restart app:      pm2 restart iptv-panel"
echo "  Stop app:         pm2 stop iptv-panel"
echo "  App status:       pm2 status"
echo
echo -e "${BLUE}Database Credentials:${NC}"
echo "  Database: iptv_panel"
echo "  Username: iptv_admin"
echo "  Password: [saved in .env file]"
echo
echo "For more information, see: UBUNTU_INSTALLATION.md"
echo
log_info "Installation log saved to: /tmp/iptv-install.log"
