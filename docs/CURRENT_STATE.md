# Current State — Shine Al Furqan LMS

> Updated through Master Plan Phase 24 (RC `1.0.0-rc.1`). Re-verify against source before relying on this in later work.

## Startup path

| App | Directory | Command | Default URL |
|-----|-----------|---------|-------------|
| API | `server/` | `npm run dev` | `http://localhost:5000` |
| Web | `client/` | `npm run dev` | `http://localhost:5173` |

Env templates: `server/.env.example`, `client/.env.example`.

- Server connects MongoDB in `server/src/server.ts` (not when importing `app` alone).
- Client proxies `/api` → `localhost:5000` via Vite; axios base URL defaults to `http://localhost:5000/api`.
- `JWT_SECRET` (min 32 chars) is required; missing/invalid env causes startup exit (no secret fallbacks).
- Demo users: run `npm run seed`, or set `SEED_ON_START=true` (non-production only). Default is no auto-seed.

## Auth path

1. `POST /api/auth/login` — returns access JWT; sets HttpOnly refresh cookie.
2. Client stores access token in `localStorage` (`saf_access_token`); cookie via `withCredentials`.
3. Axios attaches Bearer; on 401 retries once via `POST /auth/refresh`.
4. Session restore: `/auth/me`, or refresh-then-me if only cookie remains.
5. Logout revokes refresh server-side and clears cookie + local access token.
6. Forgot / reset / change-password are real APIs (see `docs/AUTH_FLOW.md`).
7. Middleware: `protect` + `authorizeRoles` for role dashboards and user APIs.

Roles: `admin` | `coordinator` | `ustad` | `student`.

## Authorization & navigation (Phase 4)

- Client path matrix: `client/src/config/routeAccess.ts`.
- Coming Soon routes are role-guarded.

## User management (Phase 5)

- Real APIs: `GET/POST/PATCH /api/users`, `PATCH /api/users/:id/status` (also `/api/v1/users`).
- Admin manages all roles; coordinator manages students only.
- UI: shared `UserRoleManagementPage` — list/search/paginate, create, edit, activate/deactivate.
- No hard delete; deactivate revokes refresh tokens.
- Persisted fields: name, email, password, role, isActive (+ timestamps / lastLogin).

## Academic domain (Phases 6–12)

- Models: Course, Module, Lesson, Batch, Enrollment, LessonProgress, Quiz, QuizQuestion, QuizAttempt, AttendanceSession, AttendanceRecord.
- Real HTTP APIs for courses through quizzes and attendance.
- UI: `/courses`, `/batches`, `/attendance`; quiz authoring/taking on course detail.
- See `docs/DOMAIN_MODEL.md`, `docs/QUIZ_RULES.md`, `docs/PHASE_11_12_CLOSURE.md`.

## Dashboards (Phase 13)

- Live aggregates for admin, coordinator, ustad (scoped), and student.
- Metric definitions: `docs/DASHBOARD_METRICS.md`.
- Lead Management is live (`/leads`); fee widgets still deferred. Header search remains mock.

## Learning resources (Phase 14)

- Lesson file uploads with allowlisted MIME + magic-byte checks.
- Auth-gated download; soft-delete removes blob.
- See `docs/UPLOADS.md`.

## Platform polish (Phases 15–18)

- API envelopes + `code` / `requestId`: `docs/API_CONTRACT.md`
- Frontend architecture: AuthContext + lazy routes + shared Modal/FormField
- Honest Coming Soon / no mock global search
- Learner E2E API flow: `tests/learner.flow.golden.test.ts`

## Performance & email (Phases 19–20)

- Paginated batches/enrollments/attendance; progress N+1 removed — `docs/PERFORMANCE.md`
- Password reset email via mail abstraction — `docs/EMAIL.md` (SMTP or console)

## Production ops (Phase 21)

- Deploy / runbook / backup / monitoring docs
- Health reports Mongo readiness (`503` when down)
- Production boot guards + seed CLI refuse

## Security (Phase 22)

- Auth rate limits (login/forgot/reset/refresh/change-password)
- Ustad-scoped batches, attendance lists, resource downloads
- Students cannot self-complete enrollments
- Abuse suite + `docs/SECURITY.md`

## Final audit & RC (Phases 23–24)

- `FINAL_AUDIT.md`, `PRODUCTION_READINESS.md`, `KNOWN_LIMITATIONS.md`
- Release candidate **`1.0.0-rc.1`** — `RELEASE_CHECKLIST.md`, `SMOKE_TESTS.md`, `RELEASE_NOTES.md`
- Gate table: `GATE_STATUS.md`

## API prefixing

- Health: `/api/v1/health` (alias `/api/health`)
- Auth / users: `/api/*` and `/api/v1/*`
- Role dashboards: `/api/admin`, `/api/coordinator`, `/api/ustad`, `/api/student`
- Resources: `/api/lessons/:id/resources`, `/api/resources/:id`

## Mock boundaries

| Area | Reality |
|------|---------|
| Login / me / refresh / logout / password flows | **Real** |
| Password reset delivery | **Real** (console or SMTP; memory in tests) |
| User management CRUD | **Real** |
| Courses / curriculum / enrollment / progress | **Real** |
| Quizzes | **Real** |
| Attendance | **Real** |
| Role dashboard APIs + UI | **Real** |
| Lesson file uploads / downloads | **Real** (local disk; prod → object storage) |
| Header global search | **Unavailable** (quick nav only; honest empty state) |
| In-app notifications | **Real** (`/notifications` inbox + System Settings send) |
| Profile page | **Partial real** (view + change password) |

## Tests

See `docs/TEST_BASELINE.md` (Phases 1–24 golden suites).

## Product readiness

**RELEASE CANDIDATE `1.0.0-rc.1`** — staging deploy + `SMOKE_TESTS.md` required before production traffic.
