const express = require('express');
const router = express.Router();
const { query } = require('../db');

// GET all users (with optional pagination & search)
router.get('/', async (req, res, next) => {
    try {
        const { search, limit, offset = 0 } = req.query;

        let countText = 'SELECT COUNT(*) FROM users';
        let dataText = 'SELECT id, email, password, given_name, family_name, created_at FROM users';
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            const where = ` WHERE email ILIKE $${params.length} OR given_name ILIKE $${params.length} OR family_name ILIKE $${params.length}`;
            countText += where;
            dataText += where;
        }

        const countResult = await query(countText, params.slice());
        const totalCount = parseInt(countResult.rows[0].count, 10);

        dataText += ' ORDER BY id DESC';

        if (limit) {
            params.push(parseInt(limit), parseInt(offset));
            dataText += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;
        }

        const result = await query(dataText, params);
        res.json({
            success: true,
            data: result.rows,
            count: totalCount,
            ...(limit && { limit: parseInt(limit), offset: parseInt(offset) }),
        });
    } catch (error) {
        next(error);
    }
});

// GET user by ID
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await query(
            'SELECT id, email, password, given_name, family_name, created_at FROM users WHERE id = $1',
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// POST create new user
router.post('/', async (req, res, next) => {
    try {
        const { email, password, given_name, family_name } = req.body;
        
        if (!email) {
            return res.status(400).json({ success: false, error: 'Email is required' });
        }

        const result = await query(
            'INSERT INTO users (email, password, given_name, family_name) VALUES ($1, $2, $3, $4) RETURNING *',
            [email, password || null, given_name || null, family_name || null]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') { // Unique violation
            return res.status(409).json({ success: false, error: 'Email already exists' });
        }
        next(error);
    }
});

// PUT update user
router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { email, password, given_name, family_name } = req.body;

        // Check if user exists
        const checkResult = await query('SELECT id FROM users WHERE id = $1', [id]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const result = await query(
            'UPDATE users SET email = COALESCE($1, email), password = COALESCE($2, password), given_name = COALESCE($3, given_name), family_name = COALESCE($4, family_name) WHERE id = $5 RETURNING *',
            [email || null, password || null, given_name || null, family_name || null, id]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ success: false, error: 'Email already exists' });
        }
        next(error);
    }
});

// DELETE bulk users
router.delete('/bulk', async (req, res, next) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, error: 'ids array is required' });
        }
        const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
        const result = await query(`DELETE FROM users WHERE id IN (${placeholders}) RETURNING id`, ids);
        res.json({ success: true, message: `${result.rows.length} users deleted`, deleted: result.rows.length });
    } catch (error) {
        next(error);
    }
});

// DELETE all users
router.delete('/all', async (_req, res, next) => {
    try {
        const result = await query('DELETE FROM users RETURNING id');
        res.json({ success: true, message: `${result.rows.length} users deleted`, deleted: result.rows.length });
    } catch (error) {
        next(error);
    }
});

// DELETE user
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        res.json({ success: true, message: 'User deleted', data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
