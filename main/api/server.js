const express = require('express');
const compression = require('compression');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(compression()); // Enable gzip compression for responses
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting middleware
const { apiLimiter } = require('./middleware/rateLimiter');
app.use('/api', apiLimiter); // Apply rate limiting to all API routes

// Import route modules
const usersRouter = require('./routes/users');
const emailDataRouter = require('./routes/emailData');
const emailInfoRouter = require('./routes/emailInfo');
const emailTemplatesRouter = require('./routes/emailTemplates');
const namesRouter = require('./routes/names');
const emailLogsRouter = require('./routes/emailLogs');
const bounceLogsRouter = require('./routes/bounceLogs');
const credentialsRouter = require('./routes/credentials');
const jobsRouter = require('./routes/jobs');
const settingsRouter = require('./routes/settings');
const trackingRouter = require('./routes/tracking');
const trackingLinksRouter = require('./routes/trackingLinks');
const campaignsRouter = require('./routes/campaigns');
const campaignTemplatesRouter = require('./routes/campaignTemplates');
const offersRouter = require('./routes/offers');
const emailSendRouter = require('./routes/emailSend');

// Use routes
app.use('/t', trackingRouter);
app.use('/api/users', usersRouter);
app.use('/api/email-data', emailDataRouter);
app.use('/api/email-info', emailInfoRouter);
app.use('/api/email-templates', emailTemplatesRouter);
app.use('/api/names', namesRouter);
app.use('/api/email-logs', emailLogsRouter);
app.use('/api/bounce-logs', bounceLogsRouter);
app.use('/api/credentials', credentialsRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/campaigns', campaignsRouter);
app.use('/api/campaign-templates', campaignTemplatesRouter);
app.use('/api/tracking-links', trackingLinksRouter);
app.use('/api/offers', offersRouter);
app.use('/api/email-send', emailSendRouter);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'GAdmin-Toolkit API',
        version: '1.0.0',
        endpoints: {
            users: '/api/users',
            emailData: '/api/email-data',
            emailInfo: '/api/email-info',
            emailTemplates: '/api/email-templates',
            names: '/api/names',
            credentials: '/api/credentials',
            jobs: '/api/jobs',
            campaigns: '/api/campaigns',
            campaignTemplates: '/api/campaign-templates',
            settings: '/api/settings',
            trackingLinks: '/api/tracking-links',
            offers: '/api/offers',
            emailSend: '/api/email-send',
            tracking: '/t/c/:trackId',
            health: '/health'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
if (require.main === module) {
    const server = app.listen(PORT, () => {
        console.log(`API server running on port ${PORT}`);
        console.log(`Visit http://localhost:${PORT} for API documentation`);
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal) => {
        console.log(`\n${signal} received. Starting graceful shutdown...`);
        
        server.close(async () => {
            console.log('HTTP server closed');
            
            try {
                const { closePool } = require('./db');
                await closePool();
                console.log('Database connections closed');
                process.exit(0);
            } catch (error) {
                console.error('Error during graceful shutdown:', error);
                process.exit(1);
            }
        });

        // Force shutdown after 10 seconds
        setTimeout(() => {
            console.error('Forced shutdown after timeout');
            process.exit(1);
        }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

module.exports = app;
