const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const {
    getTrackingLinks,
    getTrackingLink,
    createTrackingLink,
    updateTrackingLink,
    deleteTrackingLink,
    getTrackingClicks,
} = require('../db/queries');

// ── GET /api/tracking-links ────────────────────────────────────────
router.get('/', async (_req, res, next) => {
    try {
        const links = await getTrackingLinks();
        res.json({ success: true, data: links, count: links.length });
    } catch (error) {
        next(error);
    }
});

// ── GET /api/tracking-links/:id ────────────────────────────────────
router.get('/:id', async (req, res, next) => {
    try {
        const link = await getTrackingLink(req.params.id);
        if (!link) {
            return res.status(404).json({ success: false, error: 'Tracking link not found' });
        }
        res.json({ success: true, data: link });
    } catch (error) {
        next(error);
    }
});

// ── GET /api/tracking-links/:id/clicks ─────────────────────────────
router.get('/:id/clicks', async (req, res, next) => {
    try {
        const clicks = await getTrackingClicks(req.params.id);
        res.json({ success: true, data: clicks, count: clicks.length });
    } catch (error) {
        next(error);
    }
});

// ── POST /api/tracking-links ───────────────────────────────────────
router.post('/', async (req, res, next) => {
    try {
        const { offer_url, name, short_code } = req.body;
        
        if (!offer_url) {
            return res.status(400).json({ success: false, error: 'offer_url is required' });
        }

        // Validate URL format
        try {
            new URL(offer_url);
        } catch (_) {
            return res.status(400).json({ success: false, error: 'Invalid offer_url format' });
        }

        // Generate short code if not provided
        const code = short_code || crypto.randomBytes(4).toString('hex');

        const link = await createTrackingLink({
            shortCode: code,
            offerUrl: offer_url,
            name: name || null,
        });

        res.status(201).json({ success: true, data: link });
    } catch (error) {
        if (error.code === '23505') { // unique violation
            return res.status(409).json({ success: false, error: 'Short code already exists' });
        }
        next(error);
    }
});

// ── PUT /api/tracking-links/:id ────────────────────────────────────
router.put('/:id', async (req, res, next) => {
    try {
        const link = await getTrackingLink(req.params.id);
        if (!link) {
            return res.status(404).json({ success: false, error: 'Tracking link not found' });
        }

        const { offer_url, name, active } = req.body;
        const updates = {};

        if (offer_url !== undefined) {
            try {
                new URL(offer_url);
                updates.offer_url = offer_url;
            } catch (_) {
                return res.status(400).json({ success: false, error: 'Invalid offer_url format' });
            }
        }
        if (name !== undefined) updates.name = name;
        if (active !== undefined) updates.active = active;

        if (Object.keys(updates).length === 0) {
            return res.json({ success: true, data: link });
        }

        const updated = await updateTrackingLink(req.params.id, updates);
        res.json({ success: true, data: updated });
    } catch (error) {
        next(error);
    }
});

// ── DELETE /api/tracking-links/:id ─────────────────────────────────
router.delete('/:id', async (req, res, next) => {
    try {
        const link = await getTrackingLink(req.params.id);
        if (!link) {
            return res.status(404).json({ success: false, error: 'Tracking link not found' });
        }

        await deleteTrackingLink(req.params.id);
        res.json({ success: true, message: 'Tracking link deleted' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
