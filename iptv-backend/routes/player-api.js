const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Stream = require('../models/Stream');
const Category = require('../models/Category');

// Middleware to authenticate user
const authenticateUser = (req, res, next) => {
  const { username, password } = req.query;

  if (!username || !password) {
    return res.status(401).json({ error: 'Username and password required' });
  }

  const user = User.authenticate(username, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials or expired account' });
  }

  req.user = user;
  next();
};

// Player API - Main endpoint (Xtream Codes compatible)
router.get('/', authenticateUser, (req, res) => {
  const { action } = req.query;

  try {
    switch (action) {
      case 'get_live_categories':
        return handleGetLiveCategories(req, res);

      case 'get_live_streams':
        return handleGetLiveStreams(req, res);

      case 'get_vod_categories':
        return handleGetVODCategories(req, res);

      case 'get_vod_streams':
        return handleGetVODStreams(req, res);

      case 'get_vod_info':
        return handleGetVODInfo(req, res);

      case 'get_series_categories':
        return res.json([]); // Series not implemented yet

      case 'get_series':
        return res.json([]); // Series not implemented yet

      case 'get_short_epg':
        return handleGetShortEPG(req, res);

      case 'get_simple_data_table':
        return handleGetSimpleDataTable(req, res);

      default:
        // Default: return user info
        return handleGetUserInfo(req, res);
    }
  } catch (error) {
    console.error('Player API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user info
function handleGetUserInfo(req, res) {
  const { username } = req.query;
  const password = req.query.password;

  const userInfo = User.getUserInfo(username, password);
  if (!userInfo) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  res.json(userInfo);
}

// Get live categories
function handleGetLiveCategories(req, res) {
  const categories = Category.getByType('live');
  res.json(Category.formatForXtreamAPI(categories));
}

// Get live streams
function handleGetLiveStreams(req, res) {
  const { category_id } = req.query;
  let streams = Stream.getLiveStreams();

  if (category_id) {
    streams = streams.filter(s => s.category_id === parseInt(category_id));
  }

  res.json(Stream.formatForXtreamAPI(streams, 'live'));
}

// Get VOD categories
function handleGetVODCategories(req, res) {
  const categories = Category.getByType('vod');
  res.json(Category.formatForXtreamAPI(categories));
}

// Get VOD streams
function handleGetVODStreams(req, res) {
  const { category_id } = req.query;
  let streams = Stream.getVODStreams();

  if (category_id) {
    streams = streams.filter(s => s.category_id === parseInt(category_id));
  }

  const formatted = streams.map(stream => ({
    num: stream.id,
    name: stream.name,
    stream_type: 'movie',
    stream_id: stream.id,
    stream_icon: stream.stream_icon || '',
    rating: stream.rating || '0',
    rating_5based: stream.rating ? (stream.rating / 2).toFixed(1) : '0',
    added: stream.created_at,
    category_id: stream.category_id ? stream.category_id.toString() : null,
    category_name: stream.category_name || 'Uncategorized',
    container_extension: 'mp4',
    direct_source: stream.stream_url
  }));

  res.json(formatted);
}

// Get VOD info
function handleGetVODInfo(req, res) {
  const { vod_id } = req.query;

  if (!vod_id) {
    return res.status(400).json({ error: 'vod_id required' });
  }

  const vod = Stream.getVODById(vod_id);
  if (!vod) {
    return res.status(404).json({ error: 'VOD not found' });
  }

  res.json({
    info: {
      kinopoisk_url: '',
      tmdb_id: '',
      name: vod.name,
      cover: vod.stream_icon || '',
      plot: vod.plot || '',
      cast: vod.cast || '',
      director: vod.director || '',
      genre: vod.genre || '',
      releaseDate: vod.release_date || '',
      rating: vod.rating || '0',
      duration: vod.duration || '',
      video: {},
      audio: {},
      bitrate: 0
    },
    movie_data: {
      stream_id: vod.id,
      name: vod.name,
      added: vod.created_at,
      category_id: vod.category_id ? vod.category_id.toString() : '0',
      container_extension: 'mp4',
      direct_source: vod.stream_url
    }
  });
}

// Get short EPG
function handleGetShortEPG(req, res) {
  const { stream_id, limit } = req.query;

  // TODO: Implement EPG functionality
  res.json({
    epg_listings: []
  });
}

// Get simple data table
function handleGetSimpleDataTable(req, res) {
  const { stream_id } = req.query;

  if (!stream_id) {
    return res.status(400).json({ error: 'stream_id required' });
  }

  // TODO: Implement stream statistics
  res.json({
    stream_data: {
      stream_id: stream_id,
      status: 'online',
      bitrate: '0 kbps'
    }
  });
}

// M3U Playlist endpoint
router.get('/get.php', (req, res) => {
  const { username, password, type = 'm3u_plus', output = 'm3u' } = req.query;

  if (!username || !password) {
    return res.status(401).send('Unauthorized');
  }

  const user = User.authenticate(username, password);
  if (!user) {
    return res.status(401).send('Unauthorized');
  }

  const streams = Stream.getLiveStreams();
  const baseUrl = process.env.SERVER_URL || `http://${req.get('host')}`;

  let m3u = '#EXTM3U\n';

  streams.forEach(stream => {
    const streamUrl = `${baseUrl}/live/${username}/${password}/${stream.id}.m3u8`;
    m3u += `#EXTINF:-1 tvg-id="${stream.epg_channel_id || ''}" tvg-name="${stream.name}" tvg-logo="${stream.stream_icon || ''}" group-title="${stream.category_name || 'Uncategorized'}",${stream.name}\n`;
    m3u += `${streamUrl}\n`;
  });

  res.setHeader('Content-Type', 'application/x-mpegurl');
  res.setHeader('Content-Disposition', `attachment; filename="${username}.m3u"`);
  res.send(m3u);
});

// XMLTV EPG endpoint
router.get('/xmltv.php', (req, res) => {
  const { username, password } = req.query;

  if (!username || !password) {
    return res.status(401).send('Unauthorized');
  }

  const user = User.authenticate(username, password);
  if (!user) {
    return res.status(401).send('Unauthorized');
  }

  // TODO: Implement EPG XML generation
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE tv SYSTEM "xmltv.dtd">
<tv generator-info-name="IPTV Panel" generator-info-url="">
</tv>`;

  res.setHeader('Content-Type', 'application/xml');
  res.send(xml);
});

// Live stream proxy
router.get('/live/:username/:password/:streamId', (req, res) => {
  const { username, password, streamId } = req.params;

  const user = User.authenticate(username, password);
  if (!user) {
    return res.status(401).send('Unauthorized');
  }

  const stream = Stream.getLiveStreamById(streamId.replace('.m3u8', ''));
  if (!stream) {
    return res.status(404).send('Stream not found');
  }

  // Redirect to actual stream URL
  res.redirect(stream.stream_url);
});

module.exports = router;
