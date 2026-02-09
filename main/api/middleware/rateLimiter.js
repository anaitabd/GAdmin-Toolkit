const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.RATE_LIMIT_MAX ? Number(process.env.RATE_LIMIT_MAX) : 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // Skip rate limiting for health checks
    skip: (req) => req.path === '/health',
});

// Stricter rate limiter for email sending endpoints
const emailSendLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: process.env.EMAIL_SEND_RATE_LIMIT ? Number(process.env.EMAIL_SEND_RATE_LIMIT) : 10, // Limit to 10 email send requests per hour
    message: {
        success: false,
        error: 'Too many email send requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Very strict rate limiter for test email endpoints
const testEmailLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: process.env.TEST_EMAIL_RATE_LIMIT ? Number(process.env.TEST_EMAIL_RATE_LIMIT) : 5, // Limit to 5 test emails per 10 minutes
    message: {
        success: false,
        error: 'Too many test email requests, please try again in a few minutes.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter for authentication/credentials endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit to 20 requests per 15 minutes
    message: {
        success: false,
        error: 'Too many authentication attempts, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    apiLimiter,
    emailSendLimiter,
    testEmailLimiter,
    authLimiter,
};
