/**
 * Main Express Server
 * Entry point for the GAdmin-Toolkit API
 */

const express = require('express');
const cors = require('cors');
const config = require('./config');
const logger = require('./utils/logger');
const { initializePool, testConnection } = require('./db/connection');

// Import routes
const emailRoutes = require('./routes/email');
const userRoutes = require('./routes/user');
const workerRoutes = require('./routes/worker');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API Routes
app.use('/api/emails', emailRoutes);
app.use('/api/users', userRoutes);
app.use('/api/workers', workerRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Server error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
  });

  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(config.server.env === 'development' && { stack: err.stack }),
  });
});

/**
 * Start the server
 */
const startServer = async () => {
  try {
    // Initialize database
    logger.info('Initializing database connection...');
    initializePool();
    
    const dbConnected = await testConnection();
    if (!dbConnected) {
      logger.warn('Database connection failed, but server will continue');
    }

    // Start listening
    const PORT = config.server.port;
    app.listen(PORT, () => {
      logger.info(`Server started on port ${PORT}`, {
        env: config.server.env,
        nodeVersion: process.version,
      });
      console.log(`\n🚀 Server running at http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`📧 Email API: http://localhost:${PORT}/api/emails`);
      console.log(`👥 Users API: http://localhost:${PORT}/api/users`);
      console.log(`⚙️  Workers API: http://localhost:${PORT}/api/workers\n`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server if run directly
if (require.main === module) {
  startServer();
}

module.exports = app;
