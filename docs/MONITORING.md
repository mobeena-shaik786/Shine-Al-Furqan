# Monitoring & Alerting

## Probes

| Probe | URL | Expect |
|-------|-----|--------|
| Readiness | `GET /api/v1/health` | `200`, `data.ready === true` |
| Alias | `GET /api/health` | Same |

Probe interval suggestion: 30–60s. Treat consecutive `503`/timeouts as page-worthy.

## Suggested alerts

| Alert | Condition |
|-------|-----------|
| API down | Probe fails 2–3 times |
| Mongo degraded | Health returns `NOT_READY` / `mongodb: down` |
| Error rate | Elevated 5xx in reverse-proxy or morgan logs |
| Process crash loop | Orchestrator restart count |

## Logs

- Access: morgan on stdout (`rid=` for correlation with API `requestId`).
- Errors: `console.error` with request id when available.
- Ship platform logs to your aggregator; retain per compliance needs.

## Metrics (optional later)

Process CPU/memory from the host; request latency from the reverse proxy. APM (OpenTelemetry/Sentry) is optional and not required to close Phase 21.

## On-call first steps

1. Check health URL.
2. Check Mongo connectivity / Atlas status.
3. Check recent deploy + `RUNBOOK.md` rollback.
4. Check SMTP only if password-reset tickets spike.
