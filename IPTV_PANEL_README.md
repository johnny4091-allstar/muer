# 🎬 IPTV Management Panel - XUI Style

A modern, beautiful IPTV management panel similar to XUI and Xtream UI, built with cutting-edge technologies and stunning UI/UX.

![IPTV Panel](https://via.placeholder.com/1200x600?text=IPTV+Management+Panel)

## ✨ Features

### 🎯 Admin Panel
- **Modern Dashboard** - Beautiful analytics with real-time statistics
- **User Management** - Complete CRUD operations for users, roles, and subscriptions
- **Live TV Management** - Manage channels, categories, and EPG data
- **VOD Management** - Movies library with metadata and posters
- **Series Management** - TV shows with seasons and episodes
- **Package Management** - Subscription tiers and pricing
- **Analytics** - Usage statistics, popular content, revenue tracking

### 👤 User Panel
- **Stunning Home Page** - Netflix-style interface with featured content
- **Live TV** - Grid/List view with EPG (Electronic Program Guide)
- **VOD Library** - Browse movies with filters and search
- **Series Library** - Watch TV shows with episode tracking
- **Continue Watching** - Resume where you left off
- **My List** - Favorites and watchlist

### 🔌 API Compatibility
- **Xtream Codes API** - Full compatibility with IPTV players
- **M3U Playlist** - Standard M3U/M3U8 playlist generation
- **EPG (XMLTV)** - Electronic Program Guide in XML format
- **Player Support** - Works with IPTV Smarters, TiviMate, Perfect Player, etc.

## 🎨 Design Highlights

- **Glassmorphism** - Modern frosted glass effects
- **Gradient Backgrounds** - Beautiful purple/blue gradients
- **Smooth Animations** - Hover effects and transitions
- **Responsive Design** - Works on all devices
- **Dark Theme** - Easy on the eyes
- **Modern Icons** - Heroicons integration

## 🚀 Technology Stack

- **Frontend**: React 17, Remix, Tailwind CSS
- **Backend**: Node.js, Remix Server
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS with custom gradients
- **Icons**: Heroicons
- **Player**: React Player (HLS/DASH support)

## 📦 Installation

### Prerequisites
- Node.js 14+
- PostgreSQL or Supabase account
- npm or yarn

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/your-repo/iptv-panel.git
cd iptv-panel
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.sample .env
```

Edit `.env` and add your Supabase credentials:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
SESSION_SECRET=your_secret_key
```

4. **Set up the database**
```bash
# Run the SQL schema
psql -U your_user -d your_database -f database-schema.sql
```

Or import into Supabase SQL Editor.

5. **Run the development server**
```bash
npm run dev
```

6. **Build for production**
```bash
npm run build
npm run start
```

## 🔐 API Endpoints

### Xtream Codes API

**User Authentication & Info**
```
GET /player_api.php?username=XXX&password=XXX
```

**Get Live Categories**
```
GET /player_api.php?username=XXX&password=XXX&action=get_live_categories
```

**Get Live Streams**
```
GET /player_api.php?username=XXX&password=XXX&action=get_live_streams
```

**Get VOD Categories**
```
GET /player_api.php?username=XXX&password=XXX&action=get_vod_categories
```

**Get VOD Streams**
```
GET /player_api.php?username=XXX&password=XXX&action=get_vod_streams
```

**Get Series Categories**
```
GET /player_api.php?username=XXX&password=XXX&action=get_series_categories
```

**Get Series**
```
GET /player_api.php?username=XXX&password=XXX&action=get_series
```

**Get Series Info**
```
GET /player_api.php?username=XXX&password=XXX&action=get_series_info&series_id=123
```

**Get VOD Info**
```
GET /player_api.php?username=XXX&password=XXX&action=get_vod_info&vod_id=123
```

**Get EPG**
```
GET /player_api.php?username=XXX&password=XXX&action=get_short_epg&stream_id=123&limit=10
```

### M3U Playlist

```
GET /get.php?username=XXX&password=XXX&type=m3u_plus&output=ts
```

### EPG (XMLTV)

```
GET /xmltv.php?username=XXX&password=XXX
```

### Stream URLs

**Live TV**
```
http://your-domain.com/live/username/password/stream_id.m3u8
```

**VOD**
```
http://your-domain.com/movie/username/password/vod_id.mp4
```

**Series**
```
http://your-domain.com/series/username/password/episode_id.mp4
```

## 📱 IPTV Player Configuration

### IPTV Smarters Pro

1. Select "Login with Xtream Codes API"
2. Enter your server details:
   - **Server URL**: `http://your-domain.com`
   - **Username**: Your username
   - **Password**: Your password
3. Click "Add User"

### TiviMate

1. Add Playlist → Xtream Codes
2. Enter:
   - **Name**: Your panel name
   - **Server**: `http://your-domain.com`
   - **Username**: Your username
   - **Password**: Your password
3. Click "Next"

### Perfect Player

1. Settings → General → Playlists
2. Add Playlist:
   - **Name**: Your panel name
   - **URL**: `http://your-domain.com/get.php?username=XXX&password=XXX&type=m3u_plus`
3. Save

## 🎯 Admin Panel Routes

- `/admin` - Dashboard
- `/admin/users` - User Management
- `/admin/live` - Live TV Management
- `/admin/vod` - VOD Management
- `/admin/series` - Series Management
- `/admin/packages` - Package Management
- `/admin/analytics` - Analytics
- `/admin/settings` - Settings

## 👥 User Panel Routes

- `/dashboard` - User Home
- `/live` - Live TV
- `/movies` - VOD Library
- `/series` - Series Library
- `/my-list` - Favorites

## 🗄️ Database Schema

The database includes tables for:
- `users` - User accounts and authentication
- `packages` - Subscription packages
- `subscriptions` - User subscriptions
- `live_categories` & `live_streams` - Live TV
- `vod_categories` & `vod_content` - Movies
- `series_categories`, `series`, `series_seasons`, `series_episodes` - TV Shows
- `epg_programs` - Electronic Program Guide
- `user_favorites` - User favorites
- `watch_history` - Watch history and progress

## 🎨 UI Customization

### Colors
The panel uses a purple/blue gradient theme. To customize:

Edit `tailwind.config.js`:
```js
theme: {
  extend: {
    colors: {
      primary: '#8B5CF6', // Purple
      secondary: '#3B82F6', // Blue
      // Add your colors
    }
  }
}
```

### Gradients
Main gradients used:
- `from-purple-500 to-blue-500` - Primary gradient
- `from-slate-900 via-purple-900 to-slate-900` - Background

## 📊 Default Credentials

**Admin Panel**
- Username: `admin`
- Password: `admin123` (⚠️ CHANGE THIS!)

## 🔒 Security

1. **Change default admin password immediately**
2. Use strong passwords for database and session secrets
3. Enable HTTPS in production
4. Implement rate limiting for API endpoints
5. Use secure tokens for stream URLs
6. Regularly update dependencies

## 🌟 Features Roadmap

- [ ] Two-factor authentication
- [ ] Advanced analytics dashboard
- [ ] Automatic EPG fetching
- [ ] Transcoding support
- [ ] Multi-server support
- [ ] Reseller panel
- [ ] Payment gateway integration
- [ ] Mobile apps (iOS/Android)
- [ ] Catch-up TV
- [ ] Recording functionality

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 💬 Support

For support, email support@your-domain.com or join our Discord server.

## 🙏 Credits

Built with:
- [Remix](https://remix.run)
- [Tailwind CSS](https://tailwindcss.com)
- [Heroicons](https://heroicons.com)
- [React Player](https://github.com/cookpete/react-player)
- [Supabase](https://supabase.com)

---

Made with ❤️ by Your Team

🌟 If you like this project, please give it a star on GitHub!
