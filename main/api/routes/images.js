const express = require('express');
const router = express.Router();
const { query } = require('../db/index');
const { logAudit, getActionBy } = require('../middleware/auditLog');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../storage/images');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  }
});

// GET /api/images - List all uploaded images
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let queryParams = [];
    let paramCount = 1;

    if (search) {
      whereConditions.push(`name ILIKE $${paramCount}`);
      queryParams.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*) FROM uploaded_images ${whereClause}`,
      queryParams
    );

    const result = await query(
      `SELECT * FROM uploaded_images
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...queryParams, limit, offset]
    );

    res.json({
      success: true,
      data: result.rows,
      count: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/images/:id - Get single image metadata
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query('SELECT * FROM uploaded_images WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Image not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/images/:id/file - Serve the image file
router.get('/:id/file', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query('SELECT filepath, mime_type, filename FROM uploaded_images WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Image not found'
      });
    }

    const image = result.rows[0];
    res.setHeader('Content-Type', image.mime_type);
    res.sendFile(path.resolve(image.filepath));
  } catch (error) {
    next(error);
  }
});

// POST /api/images/upload - Upload image(s)
router.post('/upload', (req, res, next) => {
  upload.array('images', 10)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading
      return res.status(400).json({
        success: false,
        error: `Upload error: ${err.message}`
      });
    } else if (err) {
      // An unknown error occurred
      return res.status(400).json({
        success: false,
        error: err.message
      });
    }
    // Everything went fine, proceed to handler
    next();
  });
}, async (req, res, next) => {
  try {
    const actionBy = getActionBy(req);
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }

    const uploadedImages = [];

    for (const file of req.files) {
      const url = `/api/images/${file.filename}/file`;
      
      const result = await query(
        `INSERT INTO uploaded_images (name, filename, filepath, filesize, mime_type, url, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          file.originalname,
          file.filename,
          file.path,
          file.size,
          file.mimetype,
          url,
          actionBy
        ]
      );

      uploadedImages.push(result.rows[0]);
      await logAudit('uploaded_images', result.rows[0].id, 'upload', actionBy, null, result.rows[0]);
    }

    res.status(201).json({
      success: true,
      data: uploadedImages,
      message: `Uploaded ${uploadedImages.length} image(s)`
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/images/:id - Delete image
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const actionBy = getActionBy(req);

    const existingResult = await query('SELECT * FROM uploaded_images WHERE id = $1', [id]);
    
    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Image not found'
      });
    }

    const image = existingResult.rows[0];

    // Delete file from filesystem
    try {
      await fs.unlink(image.filepath);
    } catch (error) {
      console.error('Error deleting image file:', error);
    }

    // Delete from database
    await query('DELETE FROM uploaded_images WHERE id = $1', [id]);
    await logAudit('uploaded_images', id, 'delete', actionBy, image, null);

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
