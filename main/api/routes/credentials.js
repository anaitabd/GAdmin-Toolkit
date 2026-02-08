const express = require('express');
const router = express.Router();
const { query } = require('../db');

// GET all credentials
router.get('/', async (req, res, next) => {
    try {
        const result = await query(
            'SELECT id, name, domain, cred_json, active, created_at, updated_at FROM credentials ORDER BY id'
        );
        res.json({ success: true, data: result.rows, count: result.rows.length });
    } catch (error) {
        next(error);
    }
});

// GET active credential
router.get('/active', async (req, res, next) => {
    try {
        const result = await query(
            'SELECT id, name, domain, cred_json, active, created_at, updated_at FROM credentials WHERE active = true ORDER BY updated_at DESC LIMIT 1'
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'No active credential found' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// GET credential by ID
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await query(
            'SELECT id, name, domain, cred_json, active, created_at, updated_at FROM credentials WHERE id = $1',
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Credential not found' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// POST create new credential
router.post('/', async (req, res, next) => {
    try {
        const { name, domain, cred_json, active } = req.body;
        
        if (!name) {
            return res.status(400).json({ success: false, error: 'Name is required' });
        }
        
        if (!cred_json) {
            return res.status(400).json({ success: false, error: 'Credential JSON is required' });
        }

        // Validate that cred_json is valid JSON
        let parsedJson;
        try {
            if (typeof cred_json === 'string') {
                parsedJson = JSON.parse(cred_json);
            } else {
                parsedJson = cred_json;
            }
        } catch (e) {
            return res.status(400).json({ success: false, error: 'Invalid JSON format' });
        }

        const result = await query(
            'INSERT INTO credentials (name, domain, cred_json, active) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, domain || null, parsedJson, active !== undefined ? active : true]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') { // Unique violation
            return res.status(409).json({ success: false, error: 'Credential name already exists' });
        }
        next(error);
    }
});

// PUT update credential
router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, domain, cred_json, active } = req.body;

        // Check if credential exists
        const checkResult = await query('SELECT id FROM credentials WHERE id = $1', [id]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Credential not found' });
        }

        // Validate cred_json if provided
        let parsedJson = null;
        if (cred_json) {
            try {
                if (typeof cred_json === 'string') {
                    parsedJson = JSON.parse(cred_json);
                } else {
                    parsedJson = cred_json;
                }
            } catch (e) {
                return res.status(400).json({ success: false, error: 'Invalid JSON format' });
            }
        }

        const result = await query(
            'UPDATE credentials SET name = COALESCE($1, name), domain = $2, cred_json = COALESCE($3, cred_json), active = COALESCE($4, active), updated_at = NOW() WHERE id = $5 RETURNING *',
            [name || null, domain !== undefined ? (domain || null) : null, parsedJson, active !== undefined ? active : null, id]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ success: false, error: 'Credential name already exists' });
        }
        next(error);
    }
});

// DELETE credential
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await query('DELETE FROM credentials WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Credential not found' });
        }
        res.json({ success: true, message: 'Credential deleted', data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
