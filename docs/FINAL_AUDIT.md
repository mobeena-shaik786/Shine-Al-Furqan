# Final Evidence-Based Product Audit

**Phase:** 23  
**Date:** 2026-08-07  
**Method:** Re-scan of current `client/` + `server/` source and automated suites — not prior closure notes alone.

## Domain matrix

| Area | Status | Evidence | Notes |
|------|--------|----------|-------|
| Architecture | Fixed | Express + React + Mongo; clear route/service split | Provider-agnostic deploy |
| Auth | Fixed | Login/refresh/logout/me/forgot/reset/change | HttpOnly refresh; short access JWT |
| Authorization | Fixed | `protect` + `authorizeRoles` + service scoping | Phase 22 ustad scoping |
| Users | Fixed | CRUD + status + role filters | Admin/coordinator scopes |
| Courses / modules / lessons | Fixed | Full CRUD + publish | Draft lessons hidden from students |
| Enrollments | Fixed | Create/list/status | Students drop-only; staff complete |
| Progress | Fixed | Lesson complete + course % | Batch N+1 removed (P19) |
| Quizzes | Fixed | Create/attempt/grade | Enrollment gated |
| Attendance | Fixed | Sessions + records + student me | Ustad list scoped (P22) |
| Dashboards | Fixed | Role APIs + UI | Lead/Fee widgets deferred |
| Uploads | Fixed | MIME + magic + download auth | Local disk; object storage deferred |
| API consistency | Fixed | `success`/`code`/`requestId` | `API_CONTRACT.md` |
| Security | Fixed | `SECURITY.md` + abuse tests | react-router RSC advisory accepted |
| Tests | Fixed | Server golden + client unit | No Playwright browser E2E |
| Deployment | Fixed | `DEPLOY`/`RUNBOOK`/`BACKUP`/`MONITORING` | No Docker/CI templates |
| Docs | Fixed | Current-state + inventory | Matches behavior after P21–22 |

## Original audit disposition (summary)

| Class | Count (approx) | Examples |
|-------|----------------|----------|
| Fixed | Majority of MVP LMS gaps | Auth lifecycle, RBAC, courses, quiz, attendance, uploads, dashboards |
| Still Open | Intentional product gaps | In-app notifications, Lead/Fee CRM, global search, salaries UI depth |
| Re-scoped | Infra choices | Local disk uploads → object storage later; console mail → SMTP in prod |
| No Longer Applicable | Early mock-portal assumptions | “Demo-only auth” superseded by real JWT stack |

## Mock / Coming Soon in production paths

| Surface | Classification |
|---------|----------------|
| Header global search | Unavailable — quick-nav only (honest empty) |
| In-app notifications | Coming Soon |
| Lead / Fee dashboard widgets | Deferred — not shown as live metrics |
| Profile extras (phone, etc.) | Partial — identity + change password real |

No silent mock data is presented as live business metrics on role dashboards.

## Release blockers (Critical / High)

None remaining after Phase 22 hardening.

## Medium follow-ups (non-blocking)

1. Migrate uploads to object storage for multi-node.
2. Browser E2E (Playwright) for login → enroll → learn.
3. Revisit `react-router` when a patched SPA release supersedes GHSA-qwww-vcr4-c8h2 without regressing other advisories.
4. Optional invite emails / in-app notifications (Phase 20 partial).
