const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts per window
  message: 'Too many login attempts, please try again later',
  skipSuccessfulRequests: true,
});

const queueLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 queue operations per minute
  message: 'Too many queue operations, please slow down',
});

module.exports = {
  apiLimiter,
  authLimiter,
  queueLimiter
};
