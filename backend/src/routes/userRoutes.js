const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const userController = require('../controllers/userController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname) !== '.csv') {
      return cb(new Error('Only CSV files are allowed'));
    }
    cb(null, true);
  },
});

// All routes require authentication and admin role
router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * @swagger
 * /api/users/generate:
 *   post:
 *     summary: Generate random user data
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - domain
 *               - count
 *             properties:
 *               domain:
 *                 type: string
 *                 example: example.com
 *               count:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 1000
 *     responses:
 *       200:
 *         description: Users generated successfully
 */
router.post('/generate', userController.generateUsers);

/**
 * @swagger
 * /api/users/create:
 *   post:
 *     summary: Create users from CSV file
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - csvPath
 *             properties:
 *               csvPath:
 *                 type: string
 *     responses:
 *       200:
 *         description: Users created successfully
 */
router.post('/create', userController.createUsers);

/**
 * @swagger
 * /api/users/create-single:
 *   post:
 *     summary: Create a single user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 */
router.post('/create-single', userController.createSingleUser);

/**
 * @swagger
 * /api/users/{userKey}:
 *   delete:
 *     summary: Delete a single user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userKey
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 */
router.delete('/:userKey', userController.deleteUser);

/**
 * @swagger
 * /api/users/delete-all:
 *   delete:
 *     summary: Delete all users except admin
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users deleted successfully
 */
router.delete('/delete-all', userController.deleteAllUsers);

/**
 * @swagger
 * /api/users/list:
 *   get:
 *     summary: List all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: excludeAdmin
 *         schema:
 *           type: boolean
 *         description: Exclude admin user from results
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 */
router.get('/list', userController.listUsers);

/**
 * @swagger
 * /api/users/import-csv:
 *   post:
 *     summary: Import CSV file and create users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: CSV imported successfully
 */
router.post('/import-csv', upload.single('file'), userController.importCSV);

module.exports = router;
