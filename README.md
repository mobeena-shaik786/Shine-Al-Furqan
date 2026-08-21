# Shine Al Furqan LMS

Academy LMS (React + Express + MongoDB) — release candidate **`1.0.0-rc.1`**. See [docs/CURRENT_STATE.md](docs/CURRENT_STATE.md) and [docs/RELEASE_NOTES.md](docs/RELEASE_NOTES.md).

## Prerequisites

- Node.js 20+ recommended
- MongoDB running locally (server falls back to in-memory Mongo in non-production if local Mongo is unavailable)

## Setup

```bash
# Server
cd server
cp .env.example .env   # REQUIRED: set JWT_SECRET (min 32 chars) and Mongo URI
npm install
npm run seed           # recommended once: create local demo users (does not log passwords)

# Client
cd ../client
cp .env.example .env   # VITE_API_BASE_URL=http://localhost:5000/api
npm install
```

### Seeding

- **Preferred:** `cd server && npm run seed` (explicit; logs emails/roles only).
- **Optional on start:** set `SEED_ON_START=true` in `server/.env` (non-production only). Your local `.env` already has this on.
- **Production:** seed CLI refuses (`exit 1`); auto-seed is disabled.

### Local demo logins (case-sensitive)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@shinealfurqan.com` | `Admin@123` |
| Coordinator | `coordinator@shinealfurqan.com` | `Coordinator@123` |
| Ustad | `ustad@shinealfurqan.com` | `Ustad@123` |
| Student | `student@shinealfurqan.com` | `Student@123` |

Use the capital letter exactly (`Admin@123`, not `admin@123`). Definitions: `server/src/seeds/users.ts`.

## Run (development)

```bash
# Terminal 1 — API (default port 5000)
cd server
npm run dev

# Terminal 2 — Web (default port 5173)
cd client
npm run dev
```

Open `http://localhost:5173`.

## Production

See **[docs/DEPLOY.md](docs/DEPLOY.md)** for HTTPS/reverse-proxy assumptions, env checklist, and build commands:

```bash
cd server && npm ci && npm run build && npm run start:prod
cd client && npm ci && npm run build   # serve client/dist behind TLS
```

Also: [RUNBOOK.md](docs/RUNBOOK.md) · [BACKUP.md](docs/BACKUP.md) · [MONITORING.md](docs/MONITORING.md)

## Tests

```bash
cd server && npm test && npm run typecheck
cd client && npm test && npm run typecheck
```

See [docs/TEST_BASELINE.md](docs/TEST_BASELINE.md) for recorded results.

## Documentation

| Doc | Purpose |
|-----|---------|
| [docs/CURRENT_STATE.md](docs/CURRENT_STATE.md) | What is real vs mock |
| [docs/DEPLOY.md](docs/DEPLOY.md) | Production deploy |
| [docs/RUNBOOK.md](docs/RUNBOOK.md) | Ops incidents / rollback |
| [docs/BACKUP.md](docs/BACKUP.md) | Mongo + upload backups |
| [docs/MONITORING.md](docs/MONITORING.md) | Health probes & alerts |
| [docs/API_CONTRACT.md](docs/API_CONTRACT.md) | Success/error envelopes |
| [docs/EMAIL.md](docs/EMAIL.md) | Mail / password reset |
| [docs/UPLOADS.md](docs/UPLOADS.md) | File uploads |
| [docs/PERFORMANCE.md](docs/PERFORMANCE.md) | Pagination defaults |
| [docs/SECURITY.md](docs/SECURITY.md) | Security review checklist |
| [docs/RELEASE_CHECKLIST.md](docs/RELEASE_CHECKLIST.md) | RC deploy checklist |
| [docs/GATE_STATUS.md](docs/GATE_STATUS.md) | Phase gate table |
| [Shine_Al_Furqan_LMS_Master_Implementation_Plan.md](Shine_Al_Furqan_LMS_Master_Implementation_Plan.md) | Phased engineering plan |

## Security

- Never commit `.env` files (ignored at root, server, and client).
- `JWT_SECRET` is required in **all** environments; the server **never** uses a hardcoded secret fallback.
- Access tokens are short-lived; refresh tokens are HttpOnly cookies stored hashed server-side.
- Invalid env → process exits with a clear error.
- Production boot runs additional safety checks (`COOKIE_SECURE`, non-localhost `CLIENT_URL`, SMTP mail).
- Do not log or paste passwords, JWT secrets, or database URIs into chat or docs.
