const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const {
    generateUserList,
    createGoogleUsers,
    deleteGoogleUsers,
    getGeneratedUsers
} = require('../controllers/userController');

// All user routes require authentication and rate limiting
router.use(apiLimiter, authMiddleware);

router.post('/generate', generateUserList);
router.post('/create', createGoogleUsers);
router.delete('/delete', deleteGoogleUsers);
router.get('/', getGeneratedUsers);

module.exports = router;
