import { refreshTokenCookieOptions } from '../refresh-token-cookie';

describe('refreshTokenCookieOptions', () => {
  const nodeEnv = process.env.NODE_ENV;
  afterEach(() => {
    process.env.NODE_ENV = nodeEnv;
  });

  it('is secure in production, which is served over HTTPS', () => {
    process.env.NODE_ENV = 'production';
    expect(refreshTokenCookieOptions()).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
    });
  });

  it('is not secure outside production (plain HTTP dev / demo)', () => {
    process.env.NODE_ENV = 'development';
    expect(refreshTokenCookieOptions().secure).toBe(false);
  });
});
