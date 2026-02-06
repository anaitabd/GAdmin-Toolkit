const express = require('express');

const userController = require('../controllers/userController');

const router = express.Router();

router.get('/', userController.listUsers);
router.post('/', userController.createSingleUser);
router.post('/bulk', userController.createUsers);
router.delete('/all', userController.deleteAllUsers);
router.delete('/:email', userController.deleteUser);

module.exports = router;
