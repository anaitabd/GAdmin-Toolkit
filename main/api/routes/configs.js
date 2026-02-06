const express = require('express');
const { getDatabase } = require('../db');

const router = express.Router();

// Get all configurations
router.get('/', (req, res, next) => {
  try {
    const db = getDatabase();
    const configs = db.getAllConfigs();
    res.json({ success: true, data: configs });
  } catch (error) {
    next(error);
  }
});

// Get a specific configuration by key
router.get('/:key', (req, res, next) => {
  try {
    const db = getDatabase();
    const value = db.getConfig(req.params.key);

    if (value === null) {
      return res.status(404).json({ success: false, error: 'Configuration not found' });
    }

    res.json({ success: true, data: { key: req.params.key, value } });
  } catch (error) {
    next(error);
  }
});

// Set or update a configuration
router.put('/:key', (req, res, next) => {
  try {
    const { value, description } = req.body;

    if (value === undefined) {
      return res.status(400).json({ success: false, error: 'value is required' });
    }

    const db = getDatabase();
    db.setConfig(req.params.key, value, description);

    res.json({ success: true, data: { key: req.params.key, value } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;