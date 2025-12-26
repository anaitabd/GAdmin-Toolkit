const { logger, auditLogger } = require('../config/logger');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Log security-related errors to audit log
  if (err.name === 'UnauthorizedError' || err.statusCode === 401 || err.statusCode === 403) {
    auditLogger.warn('Security error:', {
      message: err.message,
      path: req.path,
      method: req.method,
      ip: req.ip,
      user: req.user?.username,
    });
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};

module.exports = { errorHandler, notFoundHandler };
