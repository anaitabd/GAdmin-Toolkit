const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

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

// Use routes
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
            settings: '/api/settings',
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
    app.listen(PORT, () => {
        console.log(`API server running on port ${PORT}`);
        console.log(`Visit http://localhost:${PORT} for API documentation`);
    });
}

module.exports = app;
