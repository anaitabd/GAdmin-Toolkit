const express = require('express');
const router = express.Router();
const { getAllSettings, upsertSetting } = require('../db/queries');

// GET all settings
router.get('/', async (_req, res, next) => {
    try {
        const settings = await getAllSettings();
        const obj = {};
        for (const s of settings) obj[s.key] = s.value;
        res.json({ success: true, data: obj });
    } catch (error) { next(error); }
});

// PUT update settings (accepts { key: value, ... })
router.put('/', async (req, res, next) => {
    try {
        const entries = Object.entries(req.body);
        if (!entries.length) return res.status(400).json({ success: false, error: 'No settings provided' });

        for (const [key, value] of entries) {
            await upsertSetting(key, String(value));
        }

        const settings = await getAllSettings();
        const obj = {};
        for (const s of settings) obj[s.key] = s.value;
        res.json({ success: true, data: obj });
    } catch (error) { next(error); }
});

module.exports = router;
