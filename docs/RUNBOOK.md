# Operations Runbook

## Start / stop

| Action | Command |
|--------|---------|
| Build API | `cd server && npm ci && npm run build` |
| Start API | `cd server && npm run start:prod` |
| Build SPA | `cd client && npm ci && npm run build` |
| Health | `GET /api/v1/health` (or `/api/health`) |

Process managers (systemd, PM2, container orchestrator) should restart on non-zero exit and capture stdout/stderr.

## Health interpretation

| Status | Meaning |
|--------|---------|
| `200` + `data.ready=true` | Process + MongoDB OK |
| `503` + `code=NOT_READY` | Process up, MongoDB down — do not send traffic |

## Common failures

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| API exits at boot with production safety errors | Missing `COOKIE_SECURE`, localhost `CLIENT_URL`, console mail | See `DEPLOY.md` checklist |
| Login works but refresh fails | `COOKIE_SECURE` / HTTPS / wrong `CLIENT_URL` CORS | Align SPA origin; enable Secure cookies |
| CORS errors in browser | `CLIENT_URL` ≠ SPA origin | Set exact origin including scheme |
| `503` on health | Mongo unreachable | Check `MONGODB_URI`, network, Atlas IP allowlist |
| Reset email never arrives | `MAIL_TRANSPORT` / SMTP | See `EMAIL.md` |
| Uploads missing after scale-out | Local disk not shared | Move to object storage (`UPLOADS.md`) |
| Suspected abuse / auth flooding | Rate limits / attacker | See `SECURITY.md`; rotate secrets if needed |

## Rollback

1. Keep the previous `server/dist` (or container image) and `client/dist` artifact.
2. Redeploy previous artifacts.
3. If a migration/data change shipped with the bad release, restore Mongo from the last backup (`BACKUP.md`) **before** or **with** the rollback — coordinate carefully.
4. Confirm `GET /api/v1/health` → `ready: true` and smoke login.

## Seed safety

- Never run `npm run seed` in production (script exits `1` when `NODE_ENV=production`).
- `SEED_ON_START` is ignored in production.

## Log access

Morgan writes access logs to **stdout** with `rid=` request ids. Use the host/platform log drain (CloudWatch, journald, Datadog, etc.). Do not scrape Authorization headers from custom log formats.
