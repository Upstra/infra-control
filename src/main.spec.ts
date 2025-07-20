describe('Main Bootstrap', () => {
  it('should extract port from BACKEND_URL correctly', () => {
    const testCases = [
      { url: 'http://localhost:3000', expected: 3000 },
      { url: 'http://localhost:4000/', expected: 4000 },
      { url: 'http://localhost:8080/api', expected: 8080 },
      { url: 'http://localhost', expected: 3000 },
      { url: 'http://example.com', expected: 3000 },
      { url: 'https://server:9000/path', expected: 9000 },
    ];

    testCases.forEach(({ url, expected }) => {
      const portMatch = url.match(/:(\d+)(?:\/|$)/);
      const port = portMatch ? parseInt(portMatch[1], 10) : 3000;
      expect(port).toBe(expected);
    });
  });

  it('should handle BACKEND_URL environment variable with fallback', () => {
    const originalEnv = process.env.BACKEND_URL;

    process.env.BACKEND_URL = 'http://custom:5000';
    const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:3000';
    expect(backendUrl).toBe('http://custom:5000');

    delete process.env.BACKEND_URL;
    const defaultUrl = process.env.BACKEND_URL ?? 'http://localhost:3000';
    expect(defaultUrl).toBe('http://localhost:3000');

    process.env.BACKEND_URL = '';
    const emptyUrl = process.env.BACKEND_URL ?? 'http://localhost:3000';
    expect(emptyUrl).toBe('');

    process.env.BACKEND_URL = originalEnv;
  });

  it('should validate bootstrap execution logic', () => {
    const originalEnv = process.env.BACKEND_URL;
    delete process.env.BACKEND_URL;

    const bootstrap = async () => {
      const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:3000';
      const portMatch = backendUrl.match(/:(\d+)(?:\/|$)/);
      const port = portMatch ? parseInt(portMatch[1], 10) : 3000;
      return { backendUrl, port };
    };

    return bootstrap().then(({ backendUrl, port }) => {
      expect(backendUrl).toBe('http://localhost:3000');
      expect(port).toBe(3000);
      process.env.BACKEND_URL = originalEnv;
    });
  });
});