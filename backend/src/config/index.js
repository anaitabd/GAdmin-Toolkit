const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

module.exports = {
  // Server configuration
  server: {
    port: process.env.PORT || 5000,
    host: process.env.HOST || 'localhost',
    env: process.env.NODE_ENV || 'development',
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-fallback-secret-change-this',
    expiresIn: process.env.JWT_EXPIRE || '7d',
  },

  // Google Workspace configuration
  google: {
    adminEmail: process.env.GOOGLE_ADMIN_EMAIL,
    credentialsPath: process.env.GOOGLE_CREDENTIALS_PATH || path.join(__dirname, '../../main/api/cred.json'),
    scopes: ['https://www.googleapis.com/auth/admin.directory.user'],
  },

  // Redis configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || '',
  },

  // SMTP configuration
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
  },

  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },

  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },

  // Admin configuration
  admin: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin123',
    email: process.env.ADMIN_EMAIL || 'admin@example.com',
  },

  // File upload configuration
  upload: {
    maxSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    uploadDir: process.env.UPLOAD_DIR || './uploads',
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs/app.log',
  },

  // Python scripts paths
  python: {
    scriptsPath: path.join(__dirname, '../../py'),
    venvPath: path.join(__dirname, '../../py/venv'),
  },

  // CSV files paths
  files: {
    basePath: path.join(__dirname, '../../files'),
    userListPath: path.join(__dirname, '../../files/user_list.csv'),
    namesPath: path.join(__dirname, '../../files/names.csv'),
    usersPath: path.join(__dirname, '../../files/users.csv'),
    dataPath: path.join(__dirname, '../../files/data.csv'),
    infoPath: path.join(__dirname, '../../files/info.csv'),
  },
};
