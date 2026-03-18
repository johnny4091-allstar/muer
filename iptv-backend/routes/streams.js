const express = require('express');
const router = express.Router();
const Stream = require('../models/Stream');

// Public endpoint to get all live streams (for testing)
router.get('/live', (req, res) => {
  try {
    const streams = Stream.getLiveStreams();
    res.json(streams);
  } catch (error) {
    console.error('Error getting streams:', error);
    res.status(500).json({ error: 'Failed to get streams' });
  }
});

// Public endpoint to get all VOD streams (for testing)
router.get('/vod', (req, res) => {
  try {
    const streams = Stream.getVODStreams();
    res.json(streams);
  } catch (error) {
    console.error('Error getting VOD:', error);
    res.status(500).json({ error: 'Failed to get VOD' });
  }
});

module.exports = router;
