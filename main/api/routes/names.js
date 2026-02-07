const express = require('express');
const router = express.Router();
const { query } = require('../db');

// GET all names (with optional pagination & search)
router.get('/', async (req, res, next) => {
    try {
        const { search, limit, offset = 0 } = req.query;

        let countText = 'SELECT COUNT(*) FROM names';
        let dataText = 'SELECT id, given_name, family_name, created_at FROM names';
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            const where = ` WHERE given_name ILIKE $${params.length} OR family_name ILIKE $${params.length}`;
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

// GET name by ID
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await query(
            'SELECT id, given_name, family_name, created_at FROM names WHERE id = $1',
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Name not found' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// POST create new name
router.post('/', async (req, res, next) => {
    try {
        const { given_name, family_name } = req.body;
        
        if (!given_name || !family_name) {
            return res.status(400).json({ 
                success: false, 
                error: 'given_name and family_name are required' 
            });
        }

        const result = await query(
            'INSERT INTO names (given_name, family_name) VALUES ($1, $2) RETURNING *',
            [given_name, family_name]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// PUT update name
router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { given_name, family_name } = req.body;

        // Check if record exists
        const checkResult = await query('SELECT id FROM names WHERE id = $1', [id]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Name not found' });
        }

        const result = await query(
            'UPDATE names SET given_name = COALESCE($1, given_name), family_name = COALESCE($2, family_name) WHERE id = $3 RETURNING *',
            [given_name || null, family_name || null, id]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// DELETE name
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await query('DELETE FROM names WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Name not found' });
        }
        res.json({ success: true, message: 'Name deleted', data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
