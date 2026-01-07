const express = require('express');
const router = express.Router();
const { login, setupAdmin, changePassword } = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// Public routes
router.post('/login', login);
router.post('/setup', setupAdmin);

// Protected routes
router.post('/change-password', authMiddleware, changePassword);

module.exports = router;
