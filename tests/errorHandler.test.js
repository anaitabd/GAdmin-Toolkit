const { classifyError, isRetryableError } = require('../src/utils/errorHandler');

describe('Error Handler', () => {
  describe('classifyError', () => {
    test('should classify timeout errors', () => {
      const error = { message: 'Connection timeout', code: 'ETIMEDOUT' };
      expect(classifyError(error)).toBe('timeout');
    });

    test('should classify auth errors', () => {
      const error = { message: 'Authentication failed' };
      expect(classifyError(error)).toBe('auth');
    });

    test('should classify unknown errors', () => {
      const error = { message: 'Something went wrong' };
      expect(classifyError(error)).toBe('unknown');
    });
  });

  describe('isRetryableError', () => {
    test('should identify retryable errors', () => {
      const error = { message: 'timeout' };
      expect(isRetryableError(error)).toBe(true);
    });

    test('should identify non-retryable errors', () => {
      const error = { message: 'invalid input' };
      expect(isRetryableError(error)).toBe(false);
    });
  });
});
