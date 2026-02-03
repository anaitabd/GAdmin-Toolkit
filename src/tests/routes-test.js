/**
 * API Routes Test
 * Tests the Express routes without database connection
 */

const request = require('supertest');
const app = require('../server');

// Suppress server startup logs for tests
process.env.LOG_LEVEL = 'error';

async function runTests() {
  console.log('\n📝 Testing API Routes...\n');

  // Test: Health check endpoint
  console.log('Testing health check endpoint...');
  let response = await request(app).get('/health');
  if (response.status === 200 && response.body.status === 'ok') {
    console.log('  ✓ Health check endpoint works');
  } else {
    console.error('  ✗ Health check endpoint failed');
    process.exit(1);
  }

  // Test: 404 handler
  console.log('Testing 404 handler...');
  response = await request(app).get('/api/nonexistent');
  if (response.status === 404) {
    console.log('  ✓ 404 handler works');
  } else {
    console.error('  ✗ 404 handler failed');
    process.exit(1);
  }

  // Test: Email routes are mounted
  console.log('Testing email routes (validation)...');
  response = await request(app)
    .post('/api/emails/send')
    .send({});
  // Should fail with 400 (missing fields) or 500 (no DB), not 404
  if (response.status !== 404) {
    console.log('  ✓ Email routes are mounted');
  } else {
    console.error('  ✗ Email routes not mounted');
    process.exit(1);
  }

  // Test: User routes are mounted
  console.log('Testing user routes...');
  response = await request(app).get('/api/users');
  // Should fail with 500 (no DB), not 404
  if (response.status !== 404) {
    console.log('  ✓ User routes are mounted');
  } else {
    console.error('  ✗ User routes not mounted');
    process.exit(1);
  }

  // Test: Worker routes are mounted
  console.log('Testing worker routes...');
  response = await request(app).get('/api/workers/status');
  // Should return 200 (status check doesn't need DB)
  if (response.status === 200) {
    console.log('  ✓ Worker routes are mounted and working');
  } else {
    console.error('  ✗ Worker routes failed');
    process.exit(1);
  }

  console.log('\n✅ All API route tests passed!\n');
}

// Check if supertest is available
try {
  require('supertest');
  runTests().catch(err => {
    console.error('Test error:', err.message);
    process.exit(1);
  });
} catch (e) {
  console.log('\n⚠️  supertest not installed. Install it for API tests:');
  console.log('   npm install --save-dev supertest\n');
  console.log('Skipping API route tests.\n');
}
