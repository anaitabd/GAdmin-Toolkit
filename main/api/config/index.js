const path = require('path');
const dotenv = require('dotenv');

dotenv.config({
  path: path.resolve(__dirname, '..', '.env'),
});

const config = {
  port: process.env.PORT !== undefined ? Number(process.env.PORT) : 3000,
  adminEmail: process.env.ADMIN_EMAIL,
  credPath: process.env.CRED_PATH,
  defaultDomain: process.env.DEFAULT_DOMAIN,
  quotaLimit: process.env.QUOTA_LIMIT !== undefined ? Number(process.env.QUOTA_LIMIT) : 1200000,
  requestsPerEmail:
    process.env.REQUESTS_PER_EMAIL !== undefined ? Number(process.env.REQUESTS_PER_EMAIL) : 300,
};

module.exports = { config };
