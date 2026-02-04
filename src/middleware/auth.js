const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { query } = require('../db');
const { AppError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

async function generateToken(userId, role = 'admin') {
  return jwt.sign(
    { userId, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

async function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new AppError('Invalid or expired token', 401);
  }
}

async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

async function authenticateAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.substring(7);
    const decoded = await verifyToken(token);
    
    if (decoded.role !== 'admin') {
      throw new AppError('Insufficient permissions', 403);
    }

    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
}

async function authenticateSponsor(req, res, next) {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      throw new AppError('No API key provided', 401);
    }

    const result = await query(
      'SELECT id, name, status FROM sponsors WHERE api_key = $1 AND status = $2',
      [apiKey, 'active']
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid API key', 401);
    }

    req.sponsor = result.rows[0];
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
  authenticateAdmin,
  authenticateSponsor
};
