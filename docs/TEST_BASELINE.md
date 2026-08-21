# Test Baseline

## Commands

```bash
cd server && npm run typecheck && npm test
cd client && npm run typecheck && npm test
```

## Results (Phases 22–24 / RC `1.0.0-rc.1`)

| Package | Command | Result |
|---------|---------|--------|
| server | `npm run typecheck` | Pass |
| server | `npm test` | **54 passed** (17 files) |
| client | `npm run typecheck` | Pass (prior) |
| client | `npm test` | **17 passed** (4 files) |

### Phase 22 suites

| File | Notes |
|------|-------|
| `tests/security.abuse.golden.test.ts` | NoSQL login, rate-limit headers, IDOR scoping, enrollment, secrets, oversized body (6) |

### Phase 21 suites

| File | Notes |
|------|-------|
| `tests/health.test.ts` | Mongo readiness + `/api/health` alias (3) |
| `tests/production.ops.golden.test.ts` | Seed CLI refuses in production (1) |
