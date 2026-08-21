import crypto from 'crypto';
import type { CookieOptions, Response } from 'express';
import { env } from '../config/env';

export const REFRESH_COOKIE_NAME = 'saf_refresh_token';

export function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export function generateOpaqueToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export function parseDurationToMs(duration: string): number {
  const match = /^(\d+)([smhd])$/i.exec(duration.trim());
  if (!match) {
    // Fallback 7 days if misconfigured
    return 7 * 24 * 60 * 60 * 1000;
  }
  const n = Number(match[1]);
  const unit = match[2].toLowerCase();
  const mult =
    unit === 's' ? 1000 : unit === 'm' ? 60_000 : unit === 'h' ? 3_600_000 : 86_400_000;
  return n * mult;
}

export function refreshCookieOptions(maxAgeMs: number): CookieOptions {
  return {
    httpOnly: true,
    secure: Boolean(env.COOKIE_SECURE),
    sameSite: 'lax',
    path: '/api',
    maxAge: maxAgeMs,
  };
}

export function setRefreshCookie(res: Response, rawToken: string): void {
  const maxAge = parseDurationToMs(env.JWT_REFRESH_EXPIRES_IN);
  res.cookie(REFRESH_COOKIE_NAME, rawToken, refreshCookieOptions(maxAge));
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: Boolean(env.COOKIE_SECURE),
    sameSite: 'lax',
    path: '/api',
  });
}
