/**
 * Logger Utility
 * Simple logging wrapper that can be extended to use Winston
 * For now uses console, but structured for easy Winston integration
 */

const config = require('../config');

class Logger {
  constructor(level = 'info') {
    this.level = level;
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
    };
  }

  /**
   * Check if message should be logged based on level
   */
  shouldLog(level) {
    return this.levels[level] <= this.levels[this.level];
  }

  /**
   * Format log message
   */
  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message} ${metaStr}`.trim();
  }

  /**
   * Log error message
   */
  error(message, meta = {}) {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, meta));
    }
  }

  /**
   * Log warning message
   */
  warn(message, meta = {}) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, meta));
    }
  }

  /**
   * Log info message
   */
  info(message, meta = {}) {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, meta));
    }
  }

  /**
   * Log debug message
   */
  debug(message, meta = {}) {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message, meta));
    }
  }
}

// Create and export singleton logger instance
const logger = new Logger(config.logging.level);

module.exports = logger;

/**
 * TODO: Add Winston integration when package is installed
 * 
 * const winston = require('winston');
 * 
 * const logger = winston.createLogger({
 *   level: config.logging.level,
 *   format: winston.format.combine(
 *     winston.format.timestamp(),
 *     winston.format.json()
 *   ),
 *   transports: [
 *     new winston.transports.File({ 
 *       filename: 'logs/error.log', 
 *       level: 'error',
 *       maxsize: config.logging.maxSize,
 *       maxFiles: config.logging.maxFiles,
 *     }),
 *     new winston.transports.File({ 
 *       filename: config.logging.file,
 *       maxsize: config.logging.maxSize,
 *       maxFiles: config.logging.maxFiles,
 *     }),
 *     new winston.transports.Console({
 *       format: winston.format.simple()
 *     })
 *   ]
 * });
 */
