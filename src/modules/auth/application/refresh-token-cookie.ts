import type { CookieOptions } from 'express';

export const REFRESH_TOKEN_COOKIE = 'refreshToken';

/**
 * Options of the refresh token cookie, shared by every endpoint that sets it
 * (login, register, refresh, 2FA verify and recovery) so they cannot drift.
 *
 * Production is served over HTTPS, so the cookie is `secure` there. Register
 * used to check `NODE_ENV === 'production-https'` and sent its cookie without
 * the flag in production.
 */
export const refreshTokenCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
});
