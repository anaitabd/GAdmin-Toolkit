/**
 * Basic Smoke Tests
 * Tests that verify the basic structure and imports work correctly
 */

const assert = require('assert');

// Test: Config loads correctly
console.log('\n✓ Testing config...');
const config = require('../config');
assert(config.server, 'Config should have server settings');
assert(config.database, 'Config should have database settings');
assert(config.worker, 'Config should have worker settings');
console.log('  ✓ Config loaded successfully');

// Test: Logger is available
console.log('\n✓ Testing logger...');
const logger = require('../utils/logger');
assert(logger.info, 'Logger should have info method');
assert(logger.error, 'Logger should have error method');
logger.info('Logger test message');
console.log('  ✓ Logger working');

// Test: Database connection module loads
console.log('\n✓ Testing database module...');
const db = require('../db/connection');
assert(db.initializePool, 'DB should have initializePool method');
assert(db.query, 'DB should have query method');
assert(db.getClient, 'DB should have getClient method');
console.log('  ✓ Database module loaded');

// Test: SMTP service loads
console.log('\n✓ Testing SMTP service...');
const smtpService = require('../services/email/smtp');
assert(smtpService.sendEmail, 'SMTP service should have sendEmail method');
assert(smtpService.initialize, 'SMTP service should have initialize method');
console.log('  ✓ SMTP service loaded');

// Test: Worker classes load
console.log('\n✓ Testing worker modules...');
const SendWorker = require('../workers/sendWorker');
const workerManager = require('../workers/workerManager');
assert(SendWorker, 'SendWorker should be defined');
assert(workerManager.startWorkers, 'WorkerManager should have startWorkers method');
const testWorker = new SendWorker(999);
assert(testWorker.workerId === 999, 'Worker should store workerId');
console.log('  ✓ Worker modules loaded');

// Test: Routes load
console.log('\n✓ Testing route modules...');
const emailRoutes = require('../routes/email');
const userRoutes = require('../routes/user');
const workerRoutes = require('../routes/worker');
assert(emailRoutes, 'Email routes should be defined');
assert(userRoutes, 'User routes should be defined');
assert(workerRoutes, 'Worker routes should be defined');
console.log('  ✓ Route modules loaded');

// Test: Server module loads
console.log('\n✓ Testing server module...');
const app = require('../server');
assert(app, 'App should be defined');
console.log('  ✓ Server module loaded');

console.log('\n✅ All smoke tests passed!\n');
console.log('Note: Database connection tests require PostgreSQL running.');
console.log('Note: Email sending tests require valid SMTP credentials.\n');
