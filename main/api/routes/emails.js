const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
    sendEmailViaAPI,
    sendEmailViaSMTP,
    getBouncedEmails,
    getEmailLogs
} = require('../controllers/emailController');

// All email routes require authentication
router.use(authMiddleware);

router.post('/send-api', sendEmailViaAPI);
router.post('/send-smtp', sendEmailViaSMTP);
router.get('/bounced', getBouncedEmails);
router.get('/logs', getEmailLogs);

module.exports = router;
