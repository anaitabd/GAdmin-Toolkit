import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import { pino } from 'pino';
import { config } from 'dotenv';

// Import routes and middleware
import { authRoutes } from './routes/auth';
import { scriptRoutes } from './routes/scripts';
import { jobRoutes } from './routes/jobs';
import { healthRoutes } from './routes/health';
import { metricsRoutes } from './routes/metrics';
import { initDatabase } from './db/init';
import { initRedis } from './queue/redis';

// Load environment variables
config({ path: '.env' });

// Create logger
const isDev = process.env.LOG_LEVEL === 'debug';
const logger = pino(
  isDev
    ? {
        level: process.env.LOG_LEVEL || 'info',
        transport: { target: 'pino-pretty' },
      }
    : { level: process.env.LOG_LEVEL || 'info' }
);

// Initialize Fastify
const app = Fastify({
  logger,
  trustProxy: true,
});

// Register plugins
async function registerPlugins() {
  // Security headers
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
  });

  // CORS
  await app.register(fastifyCors, {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  // Rate limiting
  await app.register(fastifyRateLimit, {
    max: parseInt(process.env.RATE_LIMIT_GLOBAL_PER_SEC || '50', 10),
    timeWindow: '1 second',
    cache: 10000,
    allowList: ['127.0.0.1'],
  });

  // JWT authentication
  await app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'change-me-in-production',
  });
}

// Register routes
async function registerRoutes() {
  await app.register(healthRoutes, { prefix: '/api' });
  await app.register(metricsRoutes, { prefix: '/api' });
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(scriptRoutes, { prefix: '/api/scripts' });
  await app.register(jobRoutes, { prefix: '/api/job' });
}

// Startup function
async function start() {
  try {
    // Initialize database
    logger.info('Initializing database...');
    await initDatabase();
    logger.info('Database initialized');

    // Initialize Redis
    logger.info('Initializing Redis...');
    await initRedis();
    logger.info('Redis initialized');

    // Register plugins
    logger.info('Registering plugins...');
    await registerPlugins();

    // Register routes
    logger.info('Registering routes...');
    await registerRoutes();

    // Start server
    const port = parseInt(process.env.PORT || '3001', 10);
    const host = process.env.HOST || '0.0.0.0';

    await app.listen({ port, host });
    logger.info(`Server listening on ${host}:${port}`);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await app.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await app.close();
  process.exit(0);
});

// Start the app
start();

export default app;

