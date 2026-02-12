const express = require('express');
const router = express.Router();
const { query } = require('../db');

// GET distinct geo values
router.get('/geos', async (_req, res, next) => {
    try {
        const result = await query(
            "SELECT DISTINCT geo FROM email_data WHERE geo IS NOT NULL AND geo != '' ORDER BY geo"
        );
        res.json({ success: true, data: result.rows.map(r => r.geo) });
    } catch (error) {
        next(error);
    }
});

// GET distinct list_name values
router.get('/list-names', async (_req, res, next) => {
    try {
        const result = await query(
            "SELECT DISTINCT list_name FROM email_data WHERE list_name IS NOT NULL AND list_name != '' ORDER BY list_name"
        );
        res.json({ success: true, data: result.rows.map(r => r.list_name) });
    } catch (error) {
        next(error);
    }
});

// GET all email data (with optional pagination, search & geo filter)
router.get('/', async (req, res, next) => {
    try {
        const { search, geo, list_name, data_list_id, limit, offset = 0 } = req.query;

        let countText = 'SELECT COUNT(*) FROM email_data';
        let dataText = `SELECT id, to_email, geo, list_name, data_list_id, first_name, last_name,
                               email_md5, verticals, is_seed, is_fresh, is_clean, is_opener,
                               is_clicker, is_leader, is_unsub, is_optout, is_hard_bounced, created_at
                        FROM email_data`;
        const params = [];
        const conditions = [];

        if (search) {
            params.push(`%${search}%`);
            conditions.push(`to_email ILIKE $${params.length}`);
        }

        if (geo) {
            params.push(geo);
            conditions.push(`geo = $${params.length}`);
        }

        if (list_name) {
            params.push(list_name);
            conditions.push(`list_name = $${params.length}`);
        }

        if (data_list_id) {
            params.push(parseInt(data_list_id));
            conditions.push(`data_list_id = $${params.length}`);
        }

        if (conditions.length > 0) {
            const where = ` WHERE ${conditions.join(' AND ')}`;
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

// GET email data by ID
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await query(
            `SELECT id, to_email, geo, list_name, data_list_id, first_name, last_name,
                    email_md5, verticals, is_seed, is_fresh, is_clean, is_opener,
                    is_clicker, is_leader, is_unsub, is_optout, is_hard_bounced, created_at
             FROM email_data WHERE id = $1`,
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Email data not found' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// POST create new email data
router.post('/', async (req, res, next) => {
    try {
        const {
            to_email, geo, list_name, data_list_id, first_name, last_name,
            verticals, is_seed, is_fresh, is_clean
        } = req.body;
        
        if (!to_email) {
            return res.status(400).json({ success: false, error: 'to_email is required' });
        }

        // Auto-compute email_md5
        const email_md5 = to_email ? require('crypto').createHash('md5').update(to_email.toLowerCase()).digest('hex') : null;

        const result = await query(
            `INSERT INTO email_data (to_email, geo, list_name, data_list_id, first_name, last_name,
                                     email_md5, verticals, is_seed, is_fresh, is_clean)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
            [to_email, geo || null, list_name || null, data_list_id || null,
             first_name || null, last_name || null, email_md5, verticals || null,
             is_seed || false, is_fresh !== undefined ? is_fresh : true,
             is_clean !== undefined ? is_clean : true]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// PUT update email data
router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            to_email, geo, list_name, data_list_id, first_name, last_name,
            verticals, is_seed, is_fresh, is_clean, is_opener, is_clicker,
            is_leader, is_unsub, is_optout, is_hard_bounced
        } = req.body;

        if (!to_email) {
            return res.status(400).json({ success: false, error: 'to_email is required' });
        }

        const checkResult = await query('SELECT id FROM email_data WHERE id = $1', [id]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Email data not found' });
        }

        // Auto-compute email_md5
        const email_md5 = to_email ? require('crypto').createHash('md5').update(to_email.toLowerCase()).digest('hex') : null;

        const result = await query(
            `UPDATE email_data SET
                to_email = $1, geo = $2, list_name = $3, data_list_id = $4,
                first_name = $5, last_name = $6, email_md5 = $7, verticals = $8,
                is_seed = $9, is_fresh = $10, is_clean = $11, is_opener = $12,
                is_clicker = $13, is_leader = $14, is_unsub = $15, is_optout = $16,
                is_hard_bounced = $17
             WHERE id = $18 RETURNING *`,
            [to_email, geo || null, list_name || null, data_list_id || null,
             first_name || null, last_name || null, email_md5, verticals || null,
             is_seed || false, is_fresh !== undefined ? is_fresh : true,
             is_clean !== undefined ? is_clean : true, is_opener || false,
             is_clicker || false, is_leader || false, is_unsub || false,
             is_optout || false, is_hard_bounced || false, id]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// DELETE bulk email data
router.delete('/bulk', async (req, res, next) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, error: 'ids array is required' });
        }
        const result = await query(
            `DELETE FROM email_data WHERE id = ANY($1::int[]) RETURNING id`,
            [ids]
        );
        res.json({ success: true, deleted: result.rowCount });
    } catch (error) {
        next(error);
    }
});

// DELETE all email data
router.delete('/all', async (_req, res, next) => {
    try {
        const result = await query('DELETE FROM email_data RETURNING id');
        res.json({ success: true, deleted: result.rowCount });
    } catch (error) {
        next(error);
    }
});

// DELETE email data by id
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await query('DELETE FROM email_data WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Email data not found' });
        }
        res.json({ success: true, message: 'Email data deleted', data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// GET /api/email-data/by-list/:listId ───────────────────────────────
router.get('/by-list/:listId', async (req, res, next) => {
    try {
        const { limit = 100, offset = 0 } = req.query;
        
        const countResult = await query(
            'SELECT COUNT(*) FROM email_data WHERE data_list_id = $1',
            [req.params.listId]
        );
        
        const result = await query(
            `SELECT * FROM email_data 
             WHERE data_list_id = $1 
             ORDER BY id DESC
             LIMIT $2 OFFSET $3`,
            [req.params.listId, parseInt(limit), parseInt(offset)]
        );
        
        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length,
            total: parseInt(countResult.rows[0].count)
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
