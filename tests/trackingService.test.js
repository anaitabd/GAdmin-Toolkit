const { 
  injectTrackingPixel, 
  rewriteLinks, 
  addUnsubscribeLink 
} = require('../src/services/trackingService');

describe('Tracking Service', () => {
  const trackingToken = 'test-token-123';
  const baseUrl = 'http://localhost:3000';

  describe('injectTrackingPixel', () => {
    test('should inject tracking pixel', () => {
      const html = '<html><body><p>Hello</p></body></html>';
      const result = injectTrackingPixel(html, trackingToken, baseUrl);
      
      expect(result).toContain(`${baseUrl}/track/open/${trackingToken}`);
      expect(result).toContain('width="1"');
      expect(result).toContain('height="1"');
    });
  });

  describe('rewriteLinks', () => {
    test('should rewrite http links', () => {
      const html = '<html><body><a href="https://example.com">Link</a></body></html>';
      const result = rewriteLinks(html, trackingToken, baseUrl);
      
      expect(result).toContain(`${baseUrl}/track/click/${trackingToken}`);
      expect(result).toContain(encodeURIComponent('https://example.com'));
    });

    test('should not rewrite mailto links', () => {
      const html = '<html><body><a href="mailto:test@example.com">Email</a></body></html>';
      const result = rewriteLinks(html, trackingToken, baseUrl);
      
      expect(result).not.toContain('/track/click/');
      expect(result).toContain('mailto:test@example.com');
    });
  });

  describe('addUnsubscribeLink', () => {
    test('should add unsubscribe link', () => {
      const html = '<html><body><p>Content</p></body></html>';
      const result = addUnsubscribeLink(html, trackingToken, baseUrl);
      
      expect(result).toContain(`${baseUrl}/track/unsubscribe/${trackingToken}`);
      expect(result).toContain('Unsubscribe');
    });
  });
});
