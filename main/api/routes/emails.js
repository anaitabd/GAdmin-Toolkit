const express = require('express');

const emailController = require('../controllers/emailController');

const router = express.Router();

router.post('/send', emailController.sendSingle);
router.post('/send-bulk', emailController.sendBulk);
router.get('/bounced/:email', emailController.getBounced);
router.get('/progress/:requestId', emailController.getBulkProgress);

module.exports = router;
