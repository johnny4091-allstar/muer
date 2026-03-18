require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const rateLimit = require('express-rate-limit');

// Import routes
const playerApiRoutes = require('./routes/player-api');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const streamRoutes = require('./routes/streams');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware - configured for HTTP only
app.use(helmet({
  hsts: false, // Disable HTTP Strict Transport Security (allows HTTP)
  contentSecurityPolicy: false, // Disable CSP for now to avoid mixed content issues
  referrerPolicy: { policy: 'no-referrer' }
}));
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Disable x-powered-by header
app.disable('x-powered-by');

// Ensure we're not redirecting to HTTPS
app.use((req, res, next) => {
  // Prevent any automatic HTTPS redirects
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

// Static files for admin panel
app.use('/admin', express.static(path.join(__dirname, 'public/admin')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/player_api.php', playerApiRoutes);
app.use('/get.php', playerApiRoutes); // M3U playlist
app.use('/xmltv.php', playerApiRoutes); // EPG
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/streams', streamRoutes);

// Serve admin panel
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin/index.html'));
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'IPTV Management Panel',
    version: '1.0.0',
    endpoints: {
      player_api: '/player_api.php',
      m3u_playlist: '/get.php',
      epg: '/xmltv.php',
      admin_panel: '/admin'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║          IPTV Management Panel - Backend Server           ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

  🚀 Server running on port: ${PORT}
  🌐 API Endpoint: http://localhost:${PORT}/player_api.php
  📱 Admin Panel: http://localhost:${PORT}/admin
  📺 M3U Playlist: http://localhost:${PORT}/get.php
  📋 EPG XML: http://localhost:${PORT}/xmltv.php

  Environment: ${process.env.NODE_ENV || 'development'}
  Database: ${process.env.DB_PATH || './data/database.sqlite'}

  Press Ctrl+C to stop
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

module.exports = app;
