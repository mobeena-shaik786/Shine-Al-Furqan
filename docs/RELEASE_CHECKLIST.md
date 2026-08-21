# Release Checklist — Shine Al Furqan LMS

**RC version:** `1.0.0-rc.1` (see `server/package.json` + `client/package.json`)

## Pre-deploy

1. Announce maintenance window.
2. Take MongoDB backup (`docs/BACKUP.md`) and store off-box; record backup ID/time.
3. Back up `UPLOAD_ROOT` (or object bucket) if files exist.
4. Confirm staging/production env against `docs/DEPLOY.md` checklist:
   - `NODE_ENV=production`
   - `COOKIE_SECURE=true`
   - Non-localhost `CLIENT_URL`
   - `MAIL_TRANSPORT=smtp` + SMTP settings
   - `SEED_ON_START=false`
   - Strong `JWT_SECRET`
5. Tag git: `git tag v1.0.0-rc.1` (when releasing from VCS).

## Build

```bash
cd server && npm ci && npm run build
cd ../client && npm ci && npm run build
```

Set client `VITE_API_BASE_URL` to the public HTTPS API prefix before client build.

## Deploy

1. Deploy API `server/dist` with `npm run start:prod`.
2. Serve `client/dist` behind TLS reverse proxy.
3. Confirm `trust proxy` hop matches the proxy.

## Post-deploy smoke

Run `docs/SMOKE_TESTS.md` for admin, coordinator, ustad, and student.

Minimum API checks:

```bash
curl -sS https://api.example.com/api/health
# expect 200, checks.mongodb == up
```

## Monitor

- Watch health probe for 15–30 minutes (`docs/MONITORING.md`).
- Watch auth error rates and 5xx logs (request id).

## Rollback triggers

Rollback if any of:

- Health `503` / Mongo down > 5 minutes
- Login broken for all roles
- Widespread 5xx after deploy
- Data corruption suspected

Rollback path: restore previous API/web artifacts + restore DB from pre-deploy backup if schema/data changed (`docs/RUNBOOK.md`).
