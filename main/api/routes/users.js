const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
    generateUserList,
    createGoogleUsers,
    deleteGoogleUsers,
    getGeneratedUsers
} = require('../controllers/userController');

// All user routes require authentication
router.use(authMiddleware);

router.post('/generate', generateUserList);
router.post('/create', createGoogleUsers);
router.delete('/delete', deleteGoogleUsers);
router.get('/', getGeneratedUsers);

module.exports = router;
