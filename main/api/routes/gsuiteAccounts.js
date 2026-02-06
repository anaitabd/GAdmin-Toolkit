const express = require('express');
const { getDatabase } = require('../db');

const router = express.Router();

// Get all G Suite accounts
router.get('/', (req, res, next) => {
  try {
    const db = getDatabase();
    const filters = {};

    if (req.query.country) filters.country = req.query.country;
    if (req.query.domain) filters.domain = req.query.domain;

    const accounts = db.getAllGSuiteAccounts(true, filters);

    res.json({ success: true, data: accounts });
  } catch (error) {
    next(error);
  }
});

// Get accounts by country
router.get('/country/:country', (req, res, next) => {
  try {
    const db = getDatabase();
    const accounts = db.getGSuiteAccountsByCountry(req.params.country);

    res.json({ success: true, data: accounts });
  } catch (error) {
    next(error);
  }
});

// Get a specific G Suite account
router.get('/:id', (req, res, next) => {
  try {
    const db = getDatabase();
    const account = db.getGSuiteAccount(parseInt(req.params.id));

    if (!account) {
      return res.status(404).json({ success: false, error: 'G Suite account not found' });
    }

    res.json({ success: true, data: account });
  } catch (error) {
    next(error);
  }
});

// Create a new G Suite account
router.post('/', (req, res, next) => {
  try {
    const {
      credentialId,
      adminEmail,
      domain,
      country,
      region,
      city,
      timezone,
      quotaLimit,
      requestsPerEmail,
      metadata,
    } = req.body;

    if (!credentialId || !adminEmail || !domain) {
      return res.status(400).json({
        success: false,
        error: 'credentialId, adminEmail, and domain are required',
      });
    }

    const db = getDatabase();
    const id = db.createGSuiteAccount({
      credentialId,
      adminEmail,
      domain,
      country,
      region,
      city,
      timezone,
      quotaLimit,
      requestsPerEmail,
      metadata,
    });

    res.status(201).json({ success: true, data: { id } });
  } catch (error) {
    next(error);
  }
});

// Update a G Suite account
router.patch('/:id', (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const updates = {};

    const allowedFields = [
      'credentialId',
      'adminEmail',
      'domain',
      'country',
      'region',
      'city',
      'timezone',
      'quotaLimit',
      'requestsPerEmail',
      'isActive',
      'metadata',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const db = getDatabase();
    const result = db.updateGSuiteAccount(id, updates);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'G Suite account not found' });
    }

    res.json({ success: true, data: { updated: result.changes } });
  } catch (error) {
    next(error);
  }
});

// Delete a G Suite account
router.delete('/:id', (req, res, next) => {
  try {
    const db = getDatabase();
    const result = db.deleteGSuiteAccount(parseInt(req.params.id));

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'G Suite account not found' });
    }

    res.json({ success: true, data: { deleted: result.changes } });
  } catch (error) {
    next(error);
  }
});

// Deactivate a G Suite account
router.post('/:id/deactivate', (req, res, next) => {
  try {
    const db = getDatabase();
    const result = db.deactivateGSuiteAccount(parseInt(req.params.id));

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'G Suite account not found' });
    }

    res.json({ success: true, data: { deactivated: result.changes } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;