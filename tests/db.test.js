const { query, testConnection, closePool } = require('../src/db');

describe('Database Connection', () => {
  afterAll(async () => {
    await closePool();
  });

  test('should connect to database', async () => {
    const result = await testConnection();
    expect(result).toBe(true);
  });

  test('should execute query', async () => {
    const result = await query('SELECT NOW() as now');
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].now).toBeDefined();
  });
});
