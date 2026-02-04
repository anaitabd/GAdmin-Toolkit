require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const logger = require('./utils/logger');
const { errorHandler } = require('./utils/errorHandler');
const { testConnection } = require('./db');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');

const authRoutes = require('./routes/auth');
const accountsRoutes = require('./routes/accounts');
const campaignsRoutes = require('./routes/campaigns');
const queueRoutes = require('./routes/queue');
const analyticsRoutes = require('./routes/analytics');
const trackingRoutes = require('./routes/tracking');
const gsuiteRoutes = require('./routes/gsuiteManagement');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip
  });
  next();
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }
  });
});

app.post('/api/auth/login', authLimiter, authRoutes);
app.use('/api/accounts', apiLimiter, accountsRoutes);
app.use('/api/campaigns', apiLimiter, campaignsRoutes);
app.use('/api/queue', apiLimiter, queueRoutes);
app.use('/api/analytics', apiLimiter, analyticsRoutes);
app.use('/api/gsuite', apiLimiter, gsuiteRoutes);
app.use('/track', trackingRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { message: 'Endpoint not found' }
  });
});

app.use(errorHandler);

async function startServer() {
  try {
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }

    app.listen(PORT, () => {
      logger.info(`Server started on port ${PORT}`);
      console.log(`✓ Server running on http://localhost:${PORT}`);
      console.log(`✓ Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason, promise });
  process.exit(1);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

if (require.main === module) {
  startServer();
}

module.exports = app;
