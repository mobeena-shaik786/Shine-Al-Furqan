# Production Deployment

Hosting shape (provider-agnostic):

```text
[ Browser HTTPS ]
       │
[ Reverse proxy / TLS terminator ]  ← nginx, Caddy, cloud LB, etc.
       │
       ├── static SPA (client/dist)
       └── Node API (server dist) ──► MongoDB
                    └── uploads / object storage
```

The API sets `trust proxy = 1` so Secure cookies and client IPs work behind one hop of TLS termination.

## Build & start

### API

```bash
cd server
cp .env.example .env   # then fill production values
npm ci
npm run build
npm run start:prod     # node dist/server.js
```

### Web

```bash
cd client
# Build-time API URL (must be the public HTTPS API prefix, including /api)
echo "VITE_API_BASE_URL=https://api.example.com/api" > .env.production
npm ci
npm run build
# Serve client/dist via the reverse proxy or a static host
```

Do **not** rely on the Vite dev proxy in production.

## Production environment checklist

| Variable | Required value |
|----------|----------------|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Managed Mongo / Atlas URI |
| `JWT_SECRET` | ≥32 chars, unique, secret manager |
| `JWT_ACCESS_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | e.g. `15m` / `7d` |
| `CLIENT_URL` | Public SPA origin (`https://app.example.com`) — **not localhost** |
| `COOKIE_SECURE` | `true` |
| `SEED_ON_START` | `false` (forced off; seed CLI also refuses) |
| `MAIL_TRANSPORT` | `smtp` |
| `SMTP_*` / `MAIL_FROM` | Real provider |
| `UPLOAD_ROOT` or object storage | See `UPLOADS.md` — local disk is single-node only |
| `CORS` | Driven by `CLIENT_URL` (single origin + credentials) |

Startup calls `assertProductionSafety()` and **exits** if these rules fail.

## HTTPS / cookies

- Terminate TLS at the reverse proxy.
- Set `COOKIE_SECURE=true` so the refresh cookie is HTTPS-only.
- Cookie `SameSite=Lax`, `Path=/api`, `HttpOnly`.
- SPA and API should share a site relationship that works with Lax (same registrable domain recommended), e.g. `app.example.com` + `api.example.com` may need careful cookie domain setup — prefer reverse-proxy path routing (`example.com/` + `example.com/api`) when possible.

## Smoke check

```bash
curl -sS https://api.example.com/api/v1/health
# expect 200, data.ready=true, checks.mongodb=up
```

Also open the SPA, log in, confirm refresh survives reload.

## Related

- [RUNBOOK.md](./RUNBOOK.md) — incidents & rollback  
- [BACKUP.md](./BACKUP.md) — Mongo + uploads  
- [MONITORING.md](./MONITORING.md) — probes & alerts  
- [EMAIL.md](./EMAIL.md) · [UPLOADS.md](./UPLOADS.md)
