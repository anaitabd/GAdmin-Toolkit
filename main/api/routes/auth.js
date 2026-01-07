const express = require('express');
const router = express.Router();
const { login, setupAdmin, changePassword } = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const { authLimiter, apiLimiter } = require('../middleware/rateLimiter');

// Public routes with strict rate limiting
router.post('/login', authLimiter, login);
router.post('/setup', authLimiter, setupAdmin);

// Protected routes with API rate limiting
router.post('/change-password', authMiddleware, apiLimiter, changePassword);

module.exports = router;
