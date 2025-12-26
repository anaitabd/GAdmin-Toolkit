const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

// Apply authentication middleware
router.use(authMiddleware);

// In-memory operation tracking
const operations = new Map();

// POST /api/status/operation - Create a new operation tracker
router.post('/operation', (req, res) => {
    const operationId = Date.now().toString() + Math.random().toString(36).substring(7);
    
    operations.set(operationId, {
        id: operationId,
        status: 'pending',
        progress: {
            current: 0,
            total: 0
        },
        startTime: new Date(),
        results: null
    });

    res.json({
        success: true,
        data: { operationId }
    });
});

// GET /api/status/:operationId - Get operation status
router.get('/:operationId', (req, res) => {
    const { operationId } = req.params;
    
    const operation = operations.get(operationId);
    
    if (!operation) {
        return res.status(404).json({
            error: { message: 'Operation not found' }
        });
    }

    res.json({
        success: true,
        data: operation
    });
});

// PUT /api/status/:operationId - Update operation status
router.put('/:operationId', (req, res) => {
    const { operationId } = req.params;
    const { status, progress, results } = req.body;
    
    const operation = operations.get(operationId);
    
    if (!operation) {
        return res.status(404).json({
            error: { message: 'Operation not found' }
        });
    }

    if (status) operation.status = status;
    if (progress) operation.progress = progress;
    if (results) operation.results = results;
    if (status === 'completed' || status === 'failed') {
        operation.endTime = new Date();
    }

    operations.set(operationId, operation);

    res.json({
        success: true,
        data: operation
    });
});

// DELETE /api/status/:operationId - Delete operation
router.delete('/:operationId', (req, res) => {
    const { operationId } = req.params;
    
    const deleted = operations.delete(operationId);
    
    if (!deleted) {
        return res.status(404).json({
            error: { message: 'Operation not found' }
        });
    }

    res.json({
        success: true,
        message: 'Operation deleted'
    });
});

module.exports = router;
