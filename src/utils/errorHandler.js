const logger = require('./logger');

class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

function errorHandler(err, req, res, next) {
  let { statusCode = 500, message } = err;

  if (!err.isOperational) {
    statusCode = 500;
    message = 'Internal server error';
  }

  logger.error('Error occurred', {
    statusCode,
    message: err.message,
    stack: err.stack,
    path: req?.path,
    method: req?.method
  });

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
}

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

function classifyError(error) {
  if (!error) return 'unknown';
  
  const message = error.message?.toLowerCase() || '';
  const code = error.code?.toLowerCase() || '';
  
  if (message.includes('timeout') || code === 'etimedout') return 'timeout';
  if (message.includes('econnrefused') || code === 'econnrefused') return 'connection_refused';
  if (message.includes('network') || code === 'enetunreach') return 'network';
  if (message.includes('authentication') || message.includes('auth')) return 'auth';
  if (message.includes('quota') || message.includes('limit')) return 'quota';
  if (message.includes('invalid') || message.includes('malformed')) return 'invalid_input';
  if (message.includes('not found') || code === 'enoent') return 'not_found';
  if (message.includes('permission') || code === 'eacces') return 'permission';
  
  return 'unknown';
}

function isRetryableError(error) {
  const type = classifyError(error);
  const retryableTypes = ['timeout', 'connection_refused', 'network', 'quota'];
  return retryableTypes.includes(type);
}

module.exports = {
  AppError,
  errorHandler,
  asyncHandler,
  classifyError,
  isRetryableError
};
