# IPTV Management Panel

A complete IPTV management system with Xtream Codes API compatibility.

## Features

### ✅ Xtream Codes API Compatible
- Full compatibility with Xtream Codes API
- Works with all IPTV players (VLC, Perfect Player, IPTV Smarters, etc.)
- M3U playlist generation
- EPG (Electronic Program Guide) support

### 📺 Content Management
- **Live Streams**: Manage TV channels
- **VOD (Video on Demand)**: Movies and series
- **Categories**: Organize content
- **EPG Data**: TV guide integration

### 👥 User Management
- Create/edit/delete users
- Set expiration dates
- Control max connections
- Trial accounts support
- User authentication

### 🎛️ Admin Panel
- Modern web-based interface
- Real-time statistics dashboard
- Easy content management
- User management

### 🔐 Security
- JWT authentication
- Password hashing (bcrypt)
- Rate limiting
- Helmet security headers

## Installation

### Quick Install (VPS)

```bash
curl -fsSL https://raw.githubusercontent.com/johnny4091-allstar/muer/main/install.sh | sudo bash
```

### Manual Installation

1. **Clone the repository**
```bash
git clone https://github.com/johnny4091-allstar/muer.git
cd muer/iptv-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
nano .env
```

4. **Initialize database**
```bash
npm run init-db
```

5. **Start the server**
```bash
npm start
```

## API Endpoints

### Xtream Codes API

**Base URL**: `http://your-server/player_api.php`

#### Get User Info
```
GET /player_api.php?username=USER&password=PASS
```

#### Get Live Categories
```
GET /player_api.php?username=USER&password=PASS&action=get_live_categories
```

#### Get Live Streams
```
GET /player_api.php?username=USER&password=PASS&action=get_live_streams
```

#### Get VOD Categories
```
GET /player_api.php?username=USER&password=PASS&action=get_vod_categories
```

#### Get VOD Streams
```
GET /player_api.php?username=USER&password=PASS&action=get_vod_streams
```

### M3U Playlist
```
GET /get.php?username=USER&password=PASS&type=m3u_plus&output=ts
```

### EPG XML
```
GET /xmltv.php?username=USER&password=PASS
```

## Configuration

### IPTV Player Setup

#### Generic IPTV App
- **Server URL**: `http://your-server-ip`
- **Port**: `80`
- **Username**: (created in admin panel)
- **Password**: (created in admin panel)

#### VLC Media Player
1. Open Network Stream
2. Enter URL:
   ```
   http://your-server-ip/get.php?username=USER&password=PASS
   ```

#### Smart IPTV
- Upload M3U playlist URL
- Set EPG URL

## Admin Panel

Access at: `http://your-server-ip/admin`

Default credentials:
- Username: `admin`
- Password: `admin123`

⚠️ **Change these immediately after first login!**

## Management Commands

```bash
# Start server
npm start

# Development mode with auto-reload
npm run dev

# Initialize database
npm run init-db

# Create new admin user
npm run create-admin

# View PM2 logs
pm2 logs iptv-panel

# Restart application
pm2 restart iptv-panel

# Stop application
pm2 stop iptv-panel
```

## Database Structure

- **users**: IPTV users and credentials
- **admins**: Admin panel users
- **live_streams**: Live TV channels
- **vod_streams**: Movies and series
- **categories**: Content categories
- **epg_data**: Electronic program guide

## Security Recommendations

1. **Change Default Credentials**
   - Change admin password immediately
   - Update JWT_SECRET in .env

2. **Enable HTTPS**
   ```bash
   certbot --nginx -d yourdomain.com
   ```

3. **Configure Firewall**
   ```bash
   ufw allow 22/tcp    # SSH
   ufw allow 80/tcp    # HTTP
   ufw allow 443/tcp   # HTTPS
   ufw enable
   ```

4. **Regular Backups**
   ```bash
   # Backup database
   cp data/database.sqlite backups/database-$(date +%Y%m%d).sqlite
   ```

## Troubleshooting

### Server won't start
```bash
# Check logs
pm2 logs iptv-panel

# Check if port is in use
netstat -tlnp | grep 3000

# Restart PM2
pm2 restart iptv-panel
```

### Can't login to admin panel
```bash
# Reset admin password
npm run create-admin
```

### Streams not playing
- Verify stream URL is accessible
- Check user credentials
- Ensure user account not expired

## Support

For issues and feature requests, please visit:
https://github.com/johnny4091-allstar/muer/issues

## License

MIT License

## Credits

Built with:
- Express.js
- better-sqlite3
- bcryptjs
- jsonwebtoken
