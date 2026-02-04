require('dotenv').config({ path: '.env.test' });

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/test_emaildb';
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';
