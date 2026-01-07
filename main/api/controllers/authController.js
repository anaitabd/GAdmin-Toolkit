const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getDB } = require('../config/database');

const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Get database connection
        const db = getDB();
        const adminsCollection = db.collection('admin');

        // Find admin user
        const admin = await adminsCollection.findOne({ username });

        if (!admin) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, admin.password);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET is not configured');
        }
        const token = jwt.sign(
            { 
                id: admin._id, 
                username: admin.username,
                role: 'admin'
            },
            jwtSecret,
            { expiresIn: process.env.JWT_EXPIRY || '24h' }
        );

        // Update last login
        await adminsCollection.updateOne(
            { _id: admin._id },
            { $set: { lastLogin: new Date() } }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                username: admin.username,
                role: 'admin'
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};

const setupAdmin = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Get database connection
        const db = getDB();
        const adminsCollection = db.collection('admin');

        // Check if admin already exists
        const existingAdmin = await adminsCollection.findOne({ username });
        if (existingAdmin) {
            return res.status(400).json({ error: 'Admin user already exists' });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create admin user
        const result = await adminsCollection.insertOne({
            username,
            password: hashedPassword,
            role: 'admin',
            createdAt: new Date(),
            lastLogin: null
        });

        res.status(201).json({
            message: 'Admin user created successfully',
            admin: {
                id: result.insertedId,
                username
            }
        });
    } catch (error) {
        console.error('Setup admin error:', error);
        res.status(500).json({ error: 'Failed to create admin user' });
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new passwords are required' });
        }

        // Get database connection
        const db = getDB();
        const adminsCollection = db.collection('admin');

        // Find admin user
        const admin = await adminsCollection.findOne({ username: req.user.username });

        if (!admin) {
            return res.status(404).json({ error: 'Admin user not found' });
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, admin.password);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        await adminsCollection.updateOne(
            { _id: admin._id },
            { $set: { password: hashedPassword, updatedAt: new Date() } }
        );

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
};

module.exports = { login, setupAdmin, changePassword };
