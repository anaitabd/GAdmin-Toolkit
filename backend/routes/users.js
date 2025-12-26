const express = require('express');
const router = express.Router();
const Joi = require('joi');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const authMiddleware = require('../middleware/auth');
const validateRequest = require('../middleware/validator');
const googleWorkspaceService = require('../services/googleWorkspace');

// Configure multer for file uploads
const upload = multer({ 
    dest: 'uploads/',
    limits: {
        fileSize: (process.env.MAX_FILE_SIZE_MB || 10) * 1024 * 1024 // Default 10MB
    }
});

// Validation schemas
const createUserSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    givenName: Joi.string().min(1).required(),
    familyName: Joi.string().min(1).required(),
    changePasswordAtNextLogin: Joi.boolean().optional()
});

const generateUsersSchema = Joi.object({
    domain: Joi.string().required(),
    count: Joi.number().integer().min(1).max(1000).required()
});

// Apply authentication middleware to all routes
router.use(authMiddleware);

// GET /api/users - List all users
router.get('/', async (req, res) => {
    try {
        const { maxResults, pageToken, orderBy } = req.query;
        
        const result = await googleWorkspaceService.listUsers({
            maxResults: maxResults ? parseInt(maxResults) : 100,
            pageToken,
            orderBy
        });

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error listing users:', error);
        res.status(500).json({
            error: {
                message: 'Failed to list users',
                details: error.message
            }
        });
    }
});

// POST /api/users - Create a single user
router.post('/', validateRequest(createUserSchema), async (req, res) => {
    try {
        const userData = req.body;
        const result = await googleWorkspaceService.createUser(userData);

        res.status(201).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({
            error: {
                message: 'Failed to create user',
                details: error.message
            }
        });
    }
});

// POST /api/users/bulk - Create multiple users from array
router.post('/bulk', async (req, res) => {
    try {
        const { users } = req.body;

        if (!Array.isArray(users) || users.length === 0) {
            return res.status(400).json({
                error: { message: 'Invalid request. Users array is required.' }
            });
        }

        // Validate each user
        for (const user of users) {
            const { error } = createUserSchema.validate(user);
            if (error) {
                return res.status(400).json({
                    error: {
                        message: 'Validation failed for one or more users',
                        details: error.details
                    }
                });
            }
        }

        const result = await googleWorkspaceService.createUsers(users);

        res.status(201).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error creating users:', error);
        res.status(500).json({
            error: {
                message: 'Failed to create users',
                details: error.message
            }
        });
    }
});

// POST /api/users/upload - Create users from CSV file
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: { message: 'No file uploaded' }
            });
        }

        const users = [];
        
        // Parse CSV file
        fs.createReadStream(req.file.path)
            .pipe(csv())
            .on('data', (row) => {
                users.push({
                    email: row.email,
                    password: row.password,
                    givenName: row.givenName,
                    familyName: row.familyName,
                    changePasswordAtNextLogin: row.changePasswordAtNextLogin === 'true'
                });
            })
            .on('end', async () => {
                // Clean up uploaded file
                fs.unlinkSync(req.file.path);

                // Create users
                const result = await googleWorkspaceService.createUsers(users);

                res.status(201).json({
                    success: true,
                    data: result
                });
            })
            .on('error', (error) => {
                // Clean up uploaded file
                if (fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
                
                res.status(500).json({
                    error: {
                        message: 'Failed to parse CSV file',
                        details: error.message
                    }
                });
            });
    } catch (error) {
        console.error('Error uploading users:', error);
        res.status(500).json({
            error: {
                message: 'Failed to upload and create users',
                details: error.message
            }
        });
    }
});

// POST /api/users/generate - Generate random users
router.post('/generate', validateRequest(generateUsersSchema), async (req, res) => {
    try {
        const { domain, count } = req.body;

        // Read names from CSV file
        const namesPath = require('path').join(__dirname, '../../files/names.csv');
        
        if (!fs.existsSync(namesPath)) {
            return res.status(400).json({
                error: { message: 'Names database file not found' }
            });
        }

        const names = [];
        
        fs.createReadStream(namesPath)
            .pipe(csv())
            .on('data', (row) => {
                // Assume CSV has columns: givenName, familyName
                if (row.givenName || row['0']) {
                    names.push({
                        givenName: row.givenName || row['0'],
                        familyName: row.familyName || row['1'] || row.givenName || row['0']
                    });
                }
            })
            .on('end', () => {
                const users = googleWorkspaceService.generateUserData(names, domain, count);
                
                res.json({
                    success: true,
                    data: {
                        users,
                        count: users.length
                    }
                });
            })
            .on('error', (error) => {
                res.status(500).json({
                    error: {
                        message: 'Failed to read names database',
                        details: error.message
                    }
                });
            });
    } catch (error) {
        console.error('Error generating users:', error);
        res.status(500).json({
            error: {
                message: 'Failed to generate users',
                details: error.message
            }
        });
    }
});

// DELETE /api/users/:userKey - Delete a single user
router.delete('/:userKey', async (req, res) => {
    try {
        const { userKey } = req.params;
        
        const result = await googleWorkspaceService.deleteUser(userKey);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            error: {
                message: 'Failed to delete user',
                details: error.message
            }
        });
    }
});

// DELETE /api/users - Delete all users (except admin)
router.delete('/', async (req, res) => {
    try {
        const result = await googleWorkspaceService.deleteAllUsers();

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error deleting users:', error);
        res.status(500).json({
            error: {
                message: 'Failed to delete users',
                details: error.message
            }
        });
    }
});

module.exports = router;
