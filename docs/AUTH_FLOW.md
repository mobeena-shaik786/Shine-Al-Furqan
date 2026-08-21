# Auth Flow (Phase 3)

## Tokens

| Token | Where | TTL (DEFAULT) | Notes |
|-------|-------|---------------|-------|
| Access JWT | Response body + `localStorage` (`saf_access_token`) | `JWT_ACCESS_EXPIRES_IN` = `15m` | Bearer header |
| Refresh | HttpOnly cookie `saf_refresh_token` (path `/api`) | `JWT_REFRESH_EXPIRES_IN` = `7d` | SHA-256 hash stored in `RefreshToken` |
| Password reset | Query `?token=` on reset page | 1 hour | SHA-256 in `PasswordResetToken`; single-use |

## Endpoints

| METHOD | Path | Auth |
|--------|------|------|
| POST | `/api/auth/login` | Public (rate-limited) |
| POST | `/api/auth/refresh` | Refresh cookie |
| POST | `/api/auth/logout` | Refresh cookie optional |
| GET | `/api/auth/me` | Bearer |
| POST | `/api/auth/forgot-password` | Public (rate-limited) |
| POST | `/api/auth/reset-password` | Public (`token` + `password`) |
| POST | `/api/auth/change-password` | Bearer |

Same routes also under `/api/v1/auth/*`.

## Client lifecycle

1. Login stores access token; browser stores refresh cookie (`withCredentials`).
2. Axios retries once on 401 via `POST /auth/refresh`, then clears session if refresh fails.
3. Logout calls API (revokes refresh) and clears local access token.
4. Forgot-password always shows a generic success message (no email enumeration).
5. Non-production servers log the reset URL to the console (no SMTP in Phase 3).

## Password policy

Min 8 characters, at least one letter and one number — applied on reset and change-password (server Zod + aligned FE forms).
