# Phase 3 Closure Note

**Phase:** Master Plan Phase 3 — Authentication Lifecycle Completion  
**Status:** Complete

## Gate check

| Criterion | Met |
|-----------|-----|
| Login works securely | Yes |
| Session restoration works | Yes (`/me` + refresh fallback) |
| Logout has server-side revocation | Yes (refresh revoke + clear cookie) |
| Token expiry predictable | Yes (access `15m` DEFAULT, refresh `7d`) |
| Refresh strategy implemented | Yes (HttpOnly cookie + hashed `RefreshToken`) |
| Forgot password real | Yes (safe message; non-prod console link) |
| Reset password real | Yes (single-use, 1h) |
| Change password real | Yes (Profile page + API) |
| Password policy consistent | Yes (8+ letter + number on reset/change) |
| Reset tokens single-use and time-limited | Yes |

## What changed

- Env TTLs: `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`
- Models: wired `RefreshToken`; added `PasswordResetToken`
- Auth service/routes: login cookie, refresh, logout, forgot, reset, change-password
- Client: axios single-flight refresh; AuthContext; Forgot/Reset/Profile UI
- Tests: `auth.lifecycle.golden.test.ts` (+ prior golden suites still green)
- Docs: `AUTH_FLOW.md`, API inventory, CURRENT_STATE, TEST_BASELINE, this closure

## Explicitly deferred

- SMTP / email provider for reset delivery in production
- Phase 4 role-aware navigation
- Phase 5+ real user/course APIs

## How to try locally

1. Ensure `server/.env` has `JWT_SECRET` (min 32). Prefer `JWT_ACCESS_EXPIRES_IN=15m`.
2. `npm run seed` if needed, then login.
3. Forgot password → check server console for reset URL (dev).
4. Profile → Change password.
