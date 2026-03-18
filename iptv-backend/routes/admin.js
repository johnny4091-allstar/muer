const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Stream = require('../models/Stream');
const Category = require('../models/Category');
const { verifyAdmin } = require('../middleware/auth');

// All admin routes require authentication
router.use(verifyAdmin);

// ============ Users Management ============

// Get all users
router.get('/users', (req, res) => {
  try {
    const users = User.getAll();
    // Remove passwords from response
    const sanitized = users.map(({ password, ...user }) => user);
    res.json(sanitized);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Create user
router.post('/users', (req, res) => {
  try {
    const { username, password, email, maxConnections, expDate, isTrial } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const userId = User.create({
      username,
      password,
      email,
      maxConnections: maxConnections || 1,
      expDate,
      isTrial: isTrial ? 1 : 0
    });

    res.status(201).json({ id: userId, message: 'User created successfully' });
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.message.includes('UNIQUE constraint')) {
      res.status(409).json({ error: 'Username already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
});

// Update user
router.put('/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    User.update(id, req.body);
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    User.delete(id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ============ Live Streams Management ============

// Get all live streams
router.get('/live-streams', (req, res) => {
  try {
    const streams = Stream.getLiveStreams();
    res.json(streams);
  } catch (error) {
    console.error('Error getting live streams:', error);
    res.status(500).json({ error: 'Failed to get live streams' });
  }
});

// Create live stream
router.post('/live-streams', (req, res) => {
  try {
    const { name, stream_url, stream_icon, category_id, epg_channel_id, status } = req.body;

    if (!name || !stream_url) {
      return res.status(400).json({ error: 'Name and stream URL required' });
    }

    const streamId = Stream.createLiveStream({
      name,
      stream_url,
      stream_icon,
      category_id,
      epg_channel_id,
      status
    });

    res.status(201).json({ id: streamId, message: 'Stream created successfully' });
  } catch (error) {
    console.error('Error creating stream:', error);
    res.status(500).json({ error: 'Failed to create stream' });
  }
});

// Update live stream
router.put('/live-streams/:id', (req, res) => {
  try {
    const { id } = req.params;
    Stream.updateLiveStream(id, req.body);
    res.json({ message: 'Stream updated successfully' });
  } catch (error) {
    console.error('Error updating stream:', error);
    res.status(500).json({ error: 'Failed to update stream' });
  }
});

// Delete live stream
router.delete('/live-streams/:id', (req, res) => {
  try {
    const { id } = req.params;
    Stream.deleteLiveStream(id);
    res.json({ message: 'Stream deleted successfully' });
  } catch (error) {
    console.error('Error deleting stream:', error);
    res.status(500).json({ error: 'Failed to delete stream' });
  }
});

// ============ VOD Management ============

// Get all VOD streams
router.get('/vod', (req, res) => {
  try {
    const vods = Stream.getVODStreams();
    res.json(vods);
  } catch (error) {
    console.error('Error getting VOD streams:', error);
    res.status(500).json({ error: 'Failed to get VOD streams' });
  }
});

// Create VOD
router.post('/vod', (req, res) => {
  try {
    const vodId = Stream.createVOD(req.body);
    res.status(201).json({ id: vodId, message: 'VOD created successfully' });
  } catch (error) {
    console.error('Error creating VOD:', error);
    res.status(500).json({ error: 'Failed to create VOD' });
  }
});

// Update VOD
router.put('/vod/:id', (req, res) => {
  try {
    const { id } = req.params;
    Stream.updateVOD(id, req.body);
    res.json({ message: 'VOD updated successfully' });
  } catch (error) {
    console.error('Error updating VOD:', error);
    res.status(500).json({ error: 'Failed to update VOD' });
  }
});

// Delete VOD
router.delete('/vod/:id', (req, res) => {
  try {
    const { id } = req.params;
    Stream.deleteVOD(id);
    res.json({ message: 'VOD deleted successfully' });
  } catch (error) {
    console.error('Error deleting VOD:', error);
    res.status(500).json({ error: 'Failed to delete VOD' });
  }
});

// ============ Categories Management ============

// Get all categories
router.get('/categories', (req, res) => {
  try {
    const { type } = req.query;
    const categories = type ? Category.getByType(type) : Category.getAll();
    res.json(categories);
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

// Create category
router.post('/categories', (req, res) => {
  try {
    const { name, type, parentId } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type required' });
    }

    const categoryId = Category.create({ name, type, parentId });
    res.status(201).json({ id: categoryId, message: 'Category created successfully' });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update category
router.put('/categories/:id', (req, res) => {
  try {
    const { id } = req.params;
    Category.update(id, req.body);
    res.json({ message: 'Category updated successfully' });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete category
router.delete('/categories/:id', (req, res) => {
  try {
    const { id } = req.params;
    Category.delete(id);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// ============ Dashboard Stats ============

router.get('/stats', (req, res) => {
  try {
    const db = require('../database/db');

    const stats = {
      users: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
      activeUsers: db.prepare('SELECT COUNT(*) as count FROM users WHERE status = "active"').get().count,
      liveStreams: db.prepare('SELECT COUNT(*) as count FROM live_streams WHERE status = "active"').get().count,
      vodStreams: db.prepare('SELECT COUNT(*) as count FROM vod_streams WHERE status = "active"').get().count,
      categories: db.prepare('SELECT COUNT(*) as count FROM categories').get().count
    };

    res.json(stats);
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

module.exports = router;
