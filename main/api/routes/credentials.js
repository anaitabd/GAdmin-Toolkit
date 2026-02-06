const express = require('express');
const { getDatabase } = require('../db');

const router = express.Router();

// Get all credentials
router.get('/', (req, res, next) => {
  try {
    const db = getDatabase();
    const credentials = db.getAllCredentials(true);
    
    // Don't send private keys in list view
    const sanitized = credentials.map((cred) => ({
      id: cred.id,
      name: cred.name,
      client_email: cred.client_email,
      project_id: cred.project_id,
      is_active: cred.is_active,
      created_at: cred.created_at,
      updated_at: cred.updated_at,
    }));

    res.json({ success: true, data: sanitized });
  } catch (error) {
    next(error);
  }
});

// Get a specific credential
router.get('/:id', (req, res, next) => {
  try {
    const db = getDatabase();
    const credential = db.getCredentialById(parseInt(req.params.id));

    if (!credential) {
      return res.status(404).json({ success: false, error: 'Credential not found' });
    }

    // Don't send private key unless explicitly requested
    const includePrivateKey = req.query.includePrivateKey === 'true';
    const sanitized = {
      id: credential.id,
      name: credential.name,
      client_email: credential.client_email,
      project_id: credential.project_id,
      is_active: credential.is_active,
      metadata: credential.metadata,
      created_at: credential.created_at,
      updated_at: credential.updated_at,
    };

    if (includePrivateKey) {
      sanitized.private_key = credential.private_key;
    }

    res.json({ success: true, data: sanitized });
  } catch (error) {
    next(error);
  }
});

// Create a new credential
router.post('/', (req, res, next) => {
  try {
    const { name, clientEmail, privateKey, projectId, metadata } = req.body;

    if (!name || !clientEmail || !privateKey) {
      return res.status(400).json({
        success: false,
        error: 'name, clientEmail, and privateKey are required',
      });
    }

    const db = getDatabase();
    const id = db.createCredential(name, clientEmail, privateKey, projectId, metadata);

    res.status(201).json({ success: true, data: { id } });
  } catch (error) {
    next(error);
  }
});

// Update a credential
router.patch('/:id', (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const updates = {};

    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.clientEmail !== undefined) updates.clientEmail = req.body.clientEmail;
    if (req.body.privateKey !== undefined) updates.privateKey = req.body.privateKey;
    if (req.body.projectId !== undefined) updates.projectId = req.body.projectId;
    if (req.body.isActive !== undefined) updates.isActive = req.body.isActive;
    if (req.body.metadata !== undefined) updates.metadata = req.body.metadata;

    const db = getDatabase();
    const result = db.updateCredential(id, updates);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Credential not found' });
    }

    res.json({ success: true, data: { updated: result.changes } });
  } catch (error) {
    next(error);
  }
});

// Delete a credential
router.delete('/:id', (req, res, next) => {
  try {
    const db = getDatabase();
    const result = db.deleteCredential(parseInt(req.params.id));

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Credential not found' });
    }

    res.json({ success: true, data: { deleted: result.changes } });
  } catch (error) {
    next(error);
  }
});

// Deactivate a credential (soft delete)
router.post('/:id/deactivate', (req, res, next) => {
  try {
    const db = getDatabase();
    const result = db.deactivateCredential(parseInt(req.params.id));

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Credential not found' });
    }

    res.json({ success: true, data: { deactivated: result.changes } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;