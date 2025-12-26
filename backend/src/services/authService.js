const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config');
const { logger, auditLogger } = require('../config/logger');

// In-memory user storage (replace with database in production)
const users = new Map();

// Initialize admin user
const initializeAdminUser = async () => {
  const hashedPassword = await bcrypt.hash(config.admin.password, 10);
  users.set(config.admin.username, {
    username: config.admin.username,
    email: config.admin.email,
    password: hashedPassword,
    role: 'admin',
    createdAt: new Date(),
  });
  logger.info('Admin user initialized');
};

/**
 * Generate JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.username, 
      username: user.username, 
      email: user.email,
      role: user.role 
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

/**
 * Authenticate user
 */
const login = async (username, password, ip) => {
  try {
    // Find user
    const user = users.get(username);
    
    if (!user) {
      auditLogger.warn('Login failed - user not found', { username, ip });
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      auditLogger.warn('Login failed - invalid password', { username, ip });
      throw new Error('Invalid credentials');
    }

    // Generate token
    const token = generateToken(user);
    
    auditLogger.info('User logged in successfully', { username, ip });
    
    return {
      token,
      user: {
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  } catch (error) {
    logger.error('Login error:', error);
    throw error;
  }
};

/**
 * Register new user (admin only)
 */
const register = async (username, email, password, role = 'user') => {
  try {
    // Check if user already exists
    if (users.has(username)) {
      throw new Error('Username already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = {
      username,
      email,
      password: hashedPassword,
      role,
      createdAt: new Date(),
    };

    users.set(username, newUser);
    
    logger.info('New user registered', { username, email, role });
    
    return {
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
    };
  } catch (error) {
    logger.error('Registration error:', error);
    throw error;
  }
};

/**
 * Verify token
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    logger.error('Token verification error:', error);
    throw new Error('Invalid or expired token');
  }
};

/**
 * Get user by username
 */
const getUserByUsername = (username) => {
  const user = users.get(username);
  if (!user) return null;
  
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

module.exports = {
  initializeAdminUser,
  login,
  register,
  verifyToken,
  generateToken,
  getUserByUsername,
};
