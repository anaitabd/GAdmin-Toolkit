const express = require('express');
const router = express.Router();
const { query } = require('../db');
const bcrypt = require('bcrypt');

// Salt rounds for bcrypt (10 is a good balance between security and performance)
const SALT_ROUNDS = 10;

// Helper function to hash passwords using bcrypt
const hashPassword = async (password) => {
    return await bcrypt.hash(password, SALT_ROUNDS);
};

// GET all admin users
router.get('/', async (req, res, next) => {
    try {
        const result = await query(
            'SELECT id, username, email, full_name, role, active, created_at, updated_at FROM admin_users ORDER BY id'
        );
        res.json({ success: true, data: result.rows, count: result.rows.length });
    } catch (error) {
        next(error);
    }
});

// GET active admin users
router.get('/active', async (req, res, next) => {
    try {
        const result = await query(
            'SELECT id, username, email, full_name, role, active, created_at, updated_at FROM admin_users WHERE active = true ORDER BY username'
        );
        res.json({ success: true, data: result.rows, count: result.rows.length });
    } catch (error) {
        next(error);
    }
});

// GET admin user by ID
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await query(
            'SELECT id, username, email, full_name, role, active, created_at, updated_at FROM admin_users WHERE id = $1',
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Admin user not found' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// POST create new admin user
router.post('/', async (req, res, next) => {
    try {
        const { username, email, password, full_name, role } = req.body;
        
        if (!username) {
            return res.status(400).json({ success: false, error: 'Username is required' });
        }
        
        if (!email) {
            return res.status(400).json({ success: false, error: 'Email is required' });
        }
        
        if (!password) {
            return res.status(400).json({ success: false, error: 'Password is required' });
        }

        const validRoles = ['admin', 'manager', 'operator'];
        const userRole = role || 'admin';
        if (!validRoles.includes(userRole)) {
            return res.status(400).json({ 
                success: false, 
                error: `Invalid role. Must be one of: ${validRoles.join(', ')}` 
            });
        }

        const passwordHash = await hashPassword(password);

        const result = await query(
            'INSERT INTO admin_users (username, email, password_hash, full_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, full_name, role, active, created_at, updated_at',
            [username, email, passwordHash, full_name || null, userRole]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') { // Unique violation
            return res.status(409).json({ success: false, error: 'Username or email already exists' });
        }
        next(error);
    }
});

// PUT update admin user
router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { username, email, password, full_name, role, active } = req.body;

        // Check if admin user exists
        const checkResult = await query('SELECT id FROM admin_users WHERE id = $1', [id]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Admin user not found' });
        }

        // Validate role if provided
        if (role) {
            const validRoles = ['admin', 'manager', 'operator'];
            if (!validRoles.includes(role)) {
                return res.status(400).json({ 
                    success: false, 
                    error: `Invalid role. Must be one of: ${validRoles.join(', ')}` 
                });
            }
        }

        // Hash password if provided
        const passwordHash = password ? await hashPassword(password) : null;

        const result = await query(
            `UPDATE admin_users 
            SET username = COALESCE($1, username), 
                email = COALESCE($2, email), 
                password_hash = COALESCE($3, password_hash),
                full_name = COALESCE($4, full_name),
                role = COALESCE($5, role),
                active = COALESCE($6, active),
                updated_at = NOW()
            WHERE id = $7 
            RETURNING id, username, email, full_name, role, active, created_at, updated_at`,
            [username || null, email || null, passwordHash, full_name || null, role || null, active !== undefined ? active : null, id]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ success: false, error: 'Username or email already exists' });
        }
        next(error);
    }
});

// DELETE admin user
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await query(
            'DELETE FROM admin_users WHERE id = $1 RETURNING id, username, email, full_name, role',
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Admin user not found' });
        }
        res.json({ success: true, message: 'Admin user deleted', data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
