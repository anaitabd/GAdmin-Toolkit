const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');

const { config } = require('./config');
const { auth } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');

const usersRoutes = require('./routes/users');
const generateRoutes = require('./routes/generate');
const emailsRoutes = require('./routes/emails');
const credentialsRoutes = require('./routes/credentials');
const configsRoutes = require('./routes/configs');
const gsuiteAccountsRoutes = require('./routes/gsuiteAccounts');
const statsRoutes = require('./routes/stats');
const accountSelectionRoutes = require('./routes/accountSelection');
const { setIo } = require('./socket');

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  // Apply rate limiting (API)
  app.use(
    '/api',
    rateLimit({
      windowMs: 60_000,
      limit: 300,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  // Auth for /api
  app.use('/api', auth);

  // Routes
  app.get('/api/health', (req, res) => res.json({ success: true, data: { status: 'ok' } }));
  app.use('/api/users', usersRoutes);
  app.use('/api/generate', generateRoutes);
  app.use('/api/emails', emailsRoutes);
  app.use('/api/credentials', credentialsRoutes);
  app.use('/api/configs', configsRoutes);
  app.use('/api/gsuite-accounts', gsuiteAccountsRoutes);
  app.use('/api/stats', statsRoutes);
  app.use('/api/account-selection', accountSelectionRoutes);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}

function startServer() {
  const port = config.port;
  const app = createApp();

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  setIo(io);

  io.on('connection', (socket) => {
    socket.emit('ready');
  });

  server.listen(port, () => {
    console.log(`API listening on port ${port}`);
  });

  return { app, server, io };
}

if (require.main === module) {
  startServer();
}

module.exports = { createApp, startServer };
