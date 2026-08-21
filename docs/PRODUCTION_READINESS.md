# Production Readiness Report

**Release candidate:** `1.0.0-rc.1`  
**Date:** 2026-08-07

## Verdict

**Ready for controlled staging / first production deploy** when operators follow `DEPLOY.md`, `BACKUP.md`, and `RELEASE_CHECKLIST.md`.

## Critical / High gaps

| Gap | Severity | Status |
|-----|----------|--------|
| Production env / cookie / SMTP guards | High | Closed (P21) |
| Auth abuse rate limits | High | Closed (P22) |
| Horizontal ustad data disclosure (batches/attendance/files) | High | Closed (P22) |
| Seed against production | High | Closed (P21) |
| Meaningful health | High | Closed (P21) |
| react-router RSC CSRF advisory | High (npm) | Accepted — SPA only; see `SECURITY.md` |

## Checklist

- [x] Automated server + client tests green at RC tag time (see `TEST_BASELINE.md`)
- [x] Production build commands documented and exercised (`npm run build` server + client)
- [x] Backup / restore procedure documented
- [x] Monitoring / health documented
- [x] Security checklist completed (`SECURITY.md`)
- [x] Known limitations published (`KNOWN_LIMITATIONS.md`)
- [ ] **Operator:** Staging deploy + role smoke tests (manual — `SMOKE_TESTS.md`)
- [ ] **Operator:** Pre-deploy DB backup recorded
