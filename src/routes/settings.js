const express = require('express');
const { asyncHandler, AppError } = require('../utils/errorHandler');
const { query } = require('../db');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateAdmin);

// Define allowed settings with validation rules
const ALLOWED_SETTINGS = {
  emailsPerHour: {
    type: 'number',
    min: 1,
    max: 10000,
    description: 'Maximum emails to send per hour per account'
  },
  burstLimit: {
    type: 'number',
    min: 1,
    max: 500,
    description: 'Maximum burst size for sending emails'
  },
  cooldownPeriod: {
    type: 'number',
    min: 0,
    max: 60000,
    description: 'Cooldown period in milliseconds between email sends'
  },
  pauseOnBounceThreshold: {
    type: 'number',
    min: 1,
    max: 100,
    description: 'Pause account after this many bounces'
  },
  timezone: {
    type: 'string',
    allowed: ['UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris'],
    description: 'System timezone for scheduling'
  },
  smtpTimeout: {
    type: 'number',
    min: 1000,
    max: 120000,
    description: 'SMTP timeout in milliseconds'
  }
};

// Validate setting value
function validateSetting(key, value) {
  const rule = ALLOWED_SETTINGS[key];
  
  if (!rule) {
    throw new AppError(`Unknown setting: ${key}`, 400);
  }

  if (rule.type === 'number') {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(numValue)) {
      throw new AppError(`${key} must be a number`, 400);
    }
    
    if (rule.min !== undefined && numValue < rule.min) {
      throw new AppError(`${key} must be at least ${rule.min}`, 400);
    }
    
    if (rule.max !== undefined && numValue > rule.max) {
      throw new AppError(`${key} must be at most ${rule.max}`, 400);
    }
    
    return numValue;
  }

  if (rule.type === 'string') {
    const strValue = String(value);
    
    if (rule.allowed && !rule.allowed.includes(strValue)) {
      throw new AppError(`${key} must be one of: ${rule.allowed.join(', ')}`, 400);
    }
    
    return strValue;
  }

  return value;
}

// GET /api/settings - Get all settings
router.get('/', asyncHandler(async (req, res) => {
  const result = await query(`
    SELECT key, value, description, updated_at
    FROM system_settings
    ORDER BY key
  `);

  // Transform to object format
  const settings = {};
  result.rows.forEach(row => {
    try {
      // JSONB values are already parsed
      settings[row.key] = {
        value: row.value,
        description: row.description,
        updatedAt: row.updated_at
      };
    } catch (error) {
      // If parsing fails, use raw value
      settings[row.key] = {
        value: row.value,
        description: row.description,
        updatedAt: row.updated_at
      };
    }
  });

  res.json({
    success: true,
    data: { 
      settings,
      allowedSettings: Object.keys(ALLOWED_SETTINGS)
    }
  });
}));

// PATCH /api/settings - Update settings
router.patch('/', asyncHandler(async (req, res) => {
  const updates = req.body;

  if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
    throw new AppError('No settings provided to update', 400);
  }

  const validatedUpdates = {};
  const errors = [];

  // Validate all settings
  for (const [key, value] of Object.entries(updates)) {
    try {
      validatedUpdates[key] = validateSetting(key, value);
    } catch (error) {
      errors.push({
        key,
        error: error.message
      });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation errors',
        details: errors
      }
    });
  }

  // Update settings in database
  const updatedSettings = [];

  for (const [key, value] of Object.entries(validatedUpdates)) {
    const result = await query(`
      INSERT INTO system_settings (key, value, description)
      VALUES ($1, $2, $3)
      ON CONFLICT (key) 
      DO UPDATE SET 
        value = $2,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [key, JSON.stringify(value), ALLOWED_SETTINGS[key].description]);

    updatedSettings.push({
      key,
      value: result.rows[0].value,
      updatedAt: result.rows[0].updated_at
    });
  }

  res.json({
    success: true,
    data: { 
      updated: updatedSettings,
      message: `${updatedSettings.length} setting(s) updated successfully`
    }
  });
}));

// GET /api/settings/:key - Get specific setting
router.get('/:key', asyncHandler(async (req, res) => {
  const { key } = req.params;

  if (!ALLOWED_SETTINGS[key]) {
    throw new AppError(`Unknown setting: ${key}`, 404);
  }

  const result = await query(
    'SELECT key, value, description, updated_at FROM system_settings WHERE key = $1',
    [key]
  );

  if (result.rows.length === 0) {
    throw new AppError('Setting not found', 404);
  }

  res.json({
    success: true,
    data: {
      setting: {
        key: result.rows[0].key,
        value: result.rows[0].value,
        description: result.rows[0].description,
        updatedAt: result.rows[0].updated_at
      }
    }
  });
}));

module.exports = router;
