# Ubuntu 20.04 Installation Guide - IPTV Management Panel

Complete guide to install and run the IPTV Management Panel on Ubuntu 20.04 LTS.

## 📋 Prerequisites

- Ubuntu 20.04 LTS Server
- Root or sudo access
- At least 2GB RAM
- 20GB disk space

## 🚀 Step-by-Step Installation

### 1. Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Node.js 18.x

```bash
# Install Node.js using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x or higher
```

### 3. Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
sudo systemctl status postgresql
```

### 4. Configure PostgreSQL Database

```bash
# Switch to postgres user
sudo -i -u postgres

# Create database and user
psql << EOF
CREATE DATABASE iptv_panel;
CREATE USER iptv_admin WITH PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE iptv_panel TO iptv_admin;
\q
EOF

# Exit postgres user
exit
```

### 5. Install Git (if not already installed)

```bash
sudo apt install -y git
```

### 6. Clone the Repository

```bash
# Create application directory
sudo mkdir -p /var/www
cd /var/www

# Clone the repository
sudo git clone https://github.com/johnny4091-allstar/muer.git iptv-panel
cd iptv-panel

# Set ownership to current user
sudo chown -R $USER:$USER /var/www/iptv-panel
```

### 7. Install Application Dependencies

```bash
cd /var/www/iptv-panel
npm install
```

### 8. Set Up Database Schema

```bash
# Import the database schema
sudo -u postgres psql -d iptv_panel -f database-schema.sql

# Verify tables were created
sudo -u postgres psql -d iptv_panel -c "\dt"
```

### 9. Configure Environment Variables

```bash
# Copy the sample environment file
cp .env.sample .env

# Edit the .env file with your settings
nano .env
```

Update the `.env` file with your configuration:

```env
# Database Configuration (if using local PostgreSQL instead of Supabase)
DATABASE_URL="postgresql://iptv_admin:your_secure_password_here@localhost:5432/iptv_panel"

# Session Secret (generate a random string)
SESSION_SECRET="generate_a_random_secret_string_here"

# Supabase Configuration (optional - if using Supabase)
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your_supabase_anon_key"
SUPABASE_SERVICE_KEY="your_supabase_service_key"

# Server Configuration
PORT=3000
NODE_ENV=production
```

To generate a secure session secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 10. Build the Application

```bash
# Build for production
npm run build
```

### 11. Test the Application

```bash
# Run in development mode first to test
npm run dev
```

Visit `http://your-server-ip:3000` to verify it's working.

Press `Ctrl+C` to stop the development server.

## 🔧 Production Deployment

### Option 1: Run with PM2 (Process Manager)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start the application with PM2
cd /var/www/iptv-panel
pm2 start npm --name "iptv-panel" -- run selfhost

# Save PM2 configuration
pm2 save

# Set PM2 to start on system boot
pm2 startup systemd
# Run the command that PM2 outputs

# Check status
pm2 status
pm2 logs iptv-panel

# Useful PM2 commands
pm2 restart iptv-panel  # Restart the app
pm2 stop iptv-panel     # Stop the app
pm2 delete iptv-panel   # Remove from PM2
```

### Option 2: Create a Systemd Service

```bash
# Create systemd service file
sudo nano /etc/systemd/system/iptv-panel.service
```

Add the following content:

```ini
[Unit]
Description=IPTV Management Panel
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/iptv-panel
Environment="NODE_ENV=production"
Environment="PORT=3000"
ExecStart=/usr/bin/npm run selfhost
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
# Set proper ownership
sudo chown -R www-data:www-data /var/www/iptv-panel

# Reload systemd
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable iptv-panel

# Start the service
sudo systemctl start iptv-panel

# Check status
sudo systemctl status iptv-panel

# View logs
sudo journalctl -u iptv-panel -f
```

## 🌐 Set Up Nginx Reverse Proxy (Recommended)

### Install Nginx

```bash
sudo apt install -y nginx
```

### Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/iptv-panel
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or IP

    # Increase buffer sizes for large requests
    client_max_body_size 100M;
    proxy_buffers 16 16k;
    proxy_buffer_size 16k;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Serve stream files
    location /live/ {
        proxy_pass http://localhost:3000/live/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
        proxy_read_timeout 300s;
    }
}
```

Enable the site and restart Nginx:

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/iptv-panel /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## 🔒 Set Up SSL with Let's Encrypt (Optional but Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is set up automatically
sudo certbot renew --dry-run
```

## 🔥 Configure Firewall

```bash
# Allow SSH (if not already allowed)
sudo ufw allow OpenSSH

# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## 📊 Monitoring and Logs

### View Application Logs

With PM2:
```bash
pm2 logs iptv-panel
pm2 logs iptv-panel --lines 100  # Last 100 lines
```

With systemd:
```bash
sudo journalctl -u iptv-panel -f  # Follow logs
sudo journalctl -u iptv-panel --since today  # Today's logs
```

### Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### PostgreSQL Logs

```bash
sudo tail -f /var/log/postgresql/postgresql-12-main.log
```

## 🔄 Updating the Application

```bash
cd /var/www/iptv-panel

# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Rebuild
npm run build

# Restart the application
pm2 restart iptv-panel
# OR
sudo systemctl restart iptv-panel
```

## 🎯 Accessing the Panel

- **Admin Panel**: `http://your-domain.com/admin`
- **User Dashboard**: `http://your-domain.com/dashboard`
- **Live TV**: `http://your-domain.com/live`

### Default Credentials

- **Username**: admin
- **Password**: admin123

⚠️ **IMPORTANT**: Change the default password immediately after first login!

## 📱 Configure IPTV Players

### Server Information
- **Server URL**: `http://your-domain.com`
- **Port**: `80` (or `443` if using SSL)

### API Endpoints
- **Xtream API**: `http://your-domain.com/player_api.php`
- **M3U Playlist**: `http://your-domain.com/get.php?username=USER&password=PASS&type=m3u_plus`
- **EPG**: `http://your-domain.com/xmltv.php?username=USER&password=PASS`

## 🐛 Troubleshooting

### Application Won't Start

```bash
# Check if port 3000 is already in use
sudo netstat -tlnp | grep 3000

# Check application logs
pm2 logs iptv-panel
# OR
sudo journalctl -u iptv-panel -n 100
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test database connection
sudo -u postgres psql -d iptv_panel -c "SELECT 1;"

# Check database credentials in .env file
cat .env | grep DATABASE
```

### Nginx Issues

```bash
# Test Nginx configuration
sudo nginx -t

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

### Permission Issues

```bash
# Fix ownership
sudo chown -R www-data:www-data /var/www/iptv-panel

# Fix permissions
sudo chmod -R 755 /var/www/iptv-panel
```

## 🔐 Security Recommendations

1. **Change default admin password immediately**
2. **Use strong database passwords**
3. **Enable SSL/HTTPS with Let's Encrypt**
4. **Configure firewall (UFW)**
5. **Regular backups of database**
6. **Keep system and packages updated**
7. **Use environment variables for sensitive data**
8. **Limit SSH access**
9. **Use fail2ban for brute force protection**

### Install Fail2ban

```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## 💾 Database Backup

### Create Backup Script

```bash
# Create backup directory
sudo mkdir -p /var/backups/iptv-panel

# Create backup script
sudo nano /usr/local/bin/backup-iptv-db.sh
```

Add the following:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/iptv-panel"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/iptv_panel_$TIMESTAMP.sql"

# Create backup
sudo -u postgres pg_dump iptv_panel > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Delete backups older than 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
```

Make it executable:

```bash
sudo chmod +x /usr/local/bin/backup-iptv-db.sh
```

### Set Up Automated Backups (Cron)

```bash
# Edit crontab
sudo crontab -e

# Add daily backup at 2 AM
0 2 * * * /usr/local/bin/backup-iptv-db.sh >> /var/log/iptv-backup.log 2>&1
```

### Restore from Backup

```bash
# Decompress backup
gunzip /var/backups/iptv-panel/iptv_panel_TIMESTAMP.sql.gz

# Restore database
sudo -u postgres psql iptv_panel < /var/backups/iptv-panel/iptv_panel_TIMESTAMP.sql
```

## 📈 Performance Optimization

### PostgreSQL Tuning

```bash
sudo nano /etc/postgresql/12/main/postgresql.conf
```

Adjust these settings based on your server specs:

```ini
shared_buffers = 256MB          # 25% of RAM
effective_cache_size = 1GB      # 50-75% of RAM
maintenance_work_mem = 64MB
work_mem = 4MB
max_connections = 100
```

Restart PostgreSQL:

```bash
sudo systemctl restart postgresql
```

### Node.js Memory Limit

If you experience memory issues, increase Node.js memory limit:

```bash
# In your PM2 startup command
pm2 start npm --name "iptv-panel" --node-args="--max-old-space-size=2048" -- run selfhost
```

## 🆘 Getting Help

- Check logs for error messages
- Verify all services are running
- Review firewall settings
- Check database connection
- Ensure correct file permissions

---

**Installation Complete!** 🎉

Your IPTV Management Panel is now running on Ubuntu 20.04.

For more information, see `IPTV_PANEL_README.md`
