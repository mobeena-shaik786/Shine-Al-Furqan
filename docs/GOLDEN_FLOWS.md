# Golden Flows Checklist

| # | Flow | Automated | Manual |
|---|------|-----------|--------|
| 1 | Successful login | `auth.golden` / lifecycle | `/login` |
| 2 | Failed login | `auth.golden` | Wrong password in UI |
| 3 | `/me` session restore | `auth.golden` | Refresh while logged in |
| 4 | Admin dashboard authorization | `rbac.golden` | `/admin/dashboard` as admin |
| 5 | Student denied admin API | `rbac.golden` | Student → admin API 403 |
| 6 | Full dashboard role matrix | `rbac.golden` | Cross-role API checks |
| 7 | Client protected route redirect | `ProtectedRoute.test` | Logged-out `/profile` |
| 8 | Role dashboard reachability | `rbac.golden` | Each role home |
| 9 | Health endpoint | `health.test` | `GET /api/v1/health` + `/api/health`; Mongo `ready` / `503` |
| 10 | Refresh + logout revoke | `auth.lifecycle` | Wait for access expiry / logout |
| 11 | Forgot / reset / change password | `auth.lifecycle` | Profile + forgot/reset pages |
| 12 | Role-filtered sidebar | `routeAccess.test` | Login as each role; inspect menu |
| 13 | Direct URL unauthorized | `RoleProtectedRoute` + matrix | Student → `/salaries` → 403 page |
| 14 | User list / create / edit / status | `users.golden` | Admin → User Management pages |
| 15 | Coordinator student-only scope | `users.golden` | Coord cannot create admin |
| 16 | Persist across browser refresh | Manual | Create user → refresh → still listed |
| 17 | Academic domain integrity | `domain.models.golden` | Courses / batches UI |
| 18 | Quiz + attendance | `quiz.attendance.golden` | `/attendance`, quiz lessons |
| 19 | Dashboard aggregates | `dashboard.golden` | Each role home shows live metrics |
| 20 | Lesson file upload / download / delete | `uploads.golden` | Course lesson resources panel |
| 21 | API error/success contract | `api.contract.golden` | requestId + INVALID_ID |
| 22 | Learner E2E (API) | `learner.flow.golden` | Admin build → student learn → quiz |
| 23 | Pagination bounds | `pagination.golden` | batches/enrollments/attendance meta |
| 24 | Password reset email | `mail.golden` | Memory outbox; no token in API |
| 25 | Production health / ops | `health.test` + docs | Deploy checklist; seed refuse in prod |
| 26 | Security abuse / IDOR | `security.abuse.golden` | Rate limits, scoping, NoSQL payload, secrets |

## Expected limitations

- No SMTP required for local demo (`MAIL_TRANSPORT=console`); production should use SMTP.
- Global search not implemented (honest quick-nav only); Lead/Fee widgets deferred.
- Uploads use local disk in demo; production should use object storage (`docs/UPLOADS.md`).
- In-app notifications / invite emails deferred.
- Browser E2E (Playwright) not added — critical flow covered via Supertest.
- User profile extras (phone, permissions UI) not persisted — core identity fields only.
- Docker/CI/cloud provider templates deferred (Phase 21 docs are provider-agnostic).
