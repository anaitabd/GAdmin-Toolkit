const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const validateRequest = require('../middleware/validator');

// In a real application, this would be stored in a database
// For now, we'll use a simple in-memory store with a default admin user
const users = [
    {
        id: 1,
        username: 'admin',
        // Default password: 'admin123' (change this in production!)
        passwordHash: '$2a$10$2A1oObOkRBl1MLOAj3xa4OQ4sd9U/N7Qq2KnHvBQ5MZoVLaK.U536',
        role: 'admin'
    }
];

// Validation schemas
const loginSchema = Joi.object({
    username: Joi.string().min(3).max(30).required(),
    password: Joi.string().min(6).required()
});

// Login endpoint
router.post('/login', validateRequest(loginSchema), async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find user
        const user = users.find(u => u.username === username);
        if (!user) {
            return res.status(401).json({ 
                error: { message: 'Invalid username or password' } 
            });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        if (!isValidPassword) {
            return res.status(401).json({ 
                error: { message: 'Invalid username or password' } 
            });
        }

        // Generate token
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            error: { message: 'Login failed' } 
        });
    }
});

// Verify token endpoint
router.get('/verify', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            error: { message: 'No token provided' } 
        });
    }

    const token = authHeader.substring(7);

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        res.json({ 
            valid: true, 
            user: {
                id: decoded.id,
                username: decoded.username,
                role: decoded.role
            }
        });
    } catch (error) {
        res.status(401).json({ 
            valid: false,
            error: { message: 'Invalid or expired token' } 
        });
    }
});

module.exports = router;
