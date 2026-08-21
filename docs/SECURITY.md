# Security Review — Shine Al Furqan LMS

**Phase:** 22  
**Date:** 2026-08-07  
**Scope:** Auth, authorization, uploads, API input, dependencies

## Checklist (master plan)

| Item | Status | Evidence |
|------|--------|----------|
| `.env` files ignored | Pass | Root / server / client `.gitignore` |
| No real secrets committed | Pass | Templates only in `.env.example` |
| No fallback production JWT secret | Pass | `env.ts` fail-fast |
| No password logging | Pass | Seeds/auth log emails only |
| bcrypt hashing active | Pass | User model pre-save |
| Password never returned by API | Pass | `select:false` + `toSafeUser`; abuse test |
| Reset tokens not logged in production | Pass | Hashed in DB; console links non-prod only |
| Refresh tokens revocable | Pass | Hashed rows + logout revoke |
| Inactive users blocked | Pass | `protect` + login checks |
| Role checks server-side | Pass | `authorizeRoles` + service guards |
| Sensitive endpoints rate-limited | Pass | login, forgot, reset, refresh, change-password, uploads |
| Helmet / security headers | Pass | `helmet()` in `app.ts` |
| CORS restricted | Pass | Single `CLIENT_URL` + credentials |
| Request payload size bounded | Pass | JSON + urlencoded `1mb` |
| File upload type/size validation | Pass | Magic bytes + allowlist + size |
| No unsafe raw HTML rendering | Pass | Lesson text via React children |
| No client-supplied role escalation | Pass | Role from DB after JWT |
| Production stack traces hidden | Pass | `errorHandler` |
| Database URI not exposed | Pass | Not in API responses |
| API keys not exposed | Pass | N/A |

## Hardening delivered (Phase 22)

- Rate limits on `/reset-password`, `/refresh`, `/change-password`
- Ustad-scoped batch list/get and attendance session list
- Resource downloads require course manager or enrolled student (not any ustad)
- Students cannot self-mark enrollment `completed` (drop only)
- RegExp search escaping for courses/batches/users
- `urlencoded` body size limit `1mb`
- Abuse suite: `tests/security.abuse.golden.test.ts`

## Dependency review

| Package | Finding | Decision |
|---------|---------|----------|
| `server` (`npm audit`) | 0 vulnerabilities | Accept |
| `client` `react-router` 7.18.2 | GHSA-qwww-vcr4-c8h2 (RSC Mode CSRF) | **Accepted with context** — app is a Vite SPA using client-side routing only (no React Router RSC / SSR framework mode). Downgrading to 7.11.x reintroduces a larger older advisory set. Re-check when a patched SPA-aligned release lands. Do **not** run `npm audit fix --force`. |

## Residual / deferred

- Access JWT in `localStorage` (XSS impact if HTML ever rendered unsafely)
- Global API rate limit remains 500/15m (auth routes have tighter limits)
- Object storage for uploads (still local disk; see `UPLOADS.md`)
- Full browser E2E abuse suite (Playwright) deferred
