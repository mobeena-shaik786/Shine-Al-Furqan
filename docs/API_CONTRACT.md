# API Contract (Phase 15)

## Success envelope

```json
{
  "success": true,
  "message": "Human-readable summary",
  "data": {},
  "meta": {},
  "requestId": "uuid-or-client-supplied"
}
```

`meta` is optional (pagination, etc.). `requestId` is always present when the request-id middleware runs.

### Intentional auth exception

`POST /api/auth/login` returns `{ success, message, accessToken, user }` (token not nested under `data`) so existing clients keep working. Documented exception.

## Error envelope

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Human-readable summary",
  "errors": [{ "field": "email", "message": "…" }],
  "requestId": "…"
}
```

`errors` is optional (primarily Zod field errors).

## Error codes

| Code | Typical status | Meaning |
|------|----------------|---------|
| `VALIDATION_ERROR` | 400 | Zod / input schema failure |
| `INVALID_ID` | 400 | Malformed Mongo ObjectId (params or CastError) |
| `BAD_REQUEST` | 400 | Generic client error |
| `UNAUTHORIZED` | 401 | Missing/invalid auth |
| `FORBIDDEN` | 403 | Authenticated but not allowed |
| `NOT_FOUND` | 404 | Missing resource |
| `CONFLICT` | 409 | Duplicate / state conflict |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected (message sanitized in production) |

## Correlation

- Middleware sets `res.locals.requestId` and response header `X-Request-Id`.
- Clients may send `X-Request-Id` (8–64 chars `[A-Za-z0-9_-]`) to continue a trace.
- Morgan logs include `rid=` without Authorization headers or bodies (secrets not logged).

## Object IDs

- Route params validated with `requireObjectIds(...)` on user/resource routes.
- Remaining CastErrors map to `INVALID_ID` via the central error handler.
