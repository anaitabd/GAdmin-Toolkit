const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { emailLimiter, apiLimiter } = require('../middleware/rateLimiter');
const {
    sendEmailViaAPI,
    sendEmailViaSMTP,
    getBouncedEmails,
    getEmailLogs
} = require('../controllers/emailController');

// All email routes require authentication
router.use(authMiddleware);

// Email sending operations with stricter rate limiting
router.post('/send-api', emailLimiter, sendEmailViaAPI);
router.post('/send-smtp', emailLimiter, sendEmailViaSMTP);

// Read operations with standard API rate limiting
router.get('/bounced', apiLimiter, getBouncedEmails);
router.get('/logs', apiLimiter, getEmailLogs);

module.exports = router;
