# API Inventory

Source: `server/src/app.ts` and route modules. Auth and users routes are mounted at both `/api/*` and `/api/v1/*`.

| METHOD | Endpoint | Purpose | Auth | Role | Status |
|--------|----------|---------|------|------|--------|
| GET | `/api/v1/health` | Readiness health (Mongo); `503 NOT_READY` if DB down | No | Public | Working |
| GET | `/api/health` | Alias of `/api/v1/health` | No | Public | Working |
| POST | `/api/auth/login` | Login + refresh cookie | No (+ rate limit) | Public | Working |
| POST | `/api/v1/auth/login` | Login (alias) | No (+ rate limit) | Public | Working |
| POST | `/api/auth/refresh` | Rotate refresh; new access | Refresh cookie | — | Working |
| POST | `/api/v1/auth/refresh` | Refresh (alias) | Refresh cookie | — | Working |
| POST | `/api/auth/logout` | Revoke refresh; clear cookie | Cookie optional | — | Working |
| POST | `/api/v1/auth/logout` | Logout (alias) | Cookie optional | — | Working |
| GET | `/api/auth/me` | Current user | Bearer | Any active | Working |
| GET | `/api/v1/auth/me` | Current user (alias) | Bearer | Any active | Working |
| POST | `/api/auth/forgot-password` | Request reset | No (+ rate limit) | Public | Working |
| POST | `/api/v1/auth/forgot-password` | Forgot (alias) | No (+ rate limit) | Public | Working |
| POST | `/api/auth/reset-password` | Apply reset token | No | Public | Working |
| POST | `/api/v1/auth/reset-password` | Reset (alias) | No | Public | Working |
| POST | `/api/auth/change-password` | Change password | Bearer | Any active | Working |
| POST | `/api/v1/auth/change-password` | Change (alias) | Bearer | Any active | Working |
| GET | `/api/users` | List users (paginate/search/filter) | Bearer | admin; coordinator (students only) | Working |
| GET | `/api/v1/users` | List users (alias) | Bearer | same | Working |
| GET | `/api/users/:id` | Get user | Bearer | admin; coordinator (students) | Working |
| POST | `/api/users` | Create user | Bearer | admin; coordinator (student role only) | Working |
| PATCH | `/api/users/:id` | Update name/email/password | Bearer | admin; coordinator (students) | Working |
| PATCH | `/api/users/:id/status` | Activate / deactivate | Bearer | admin; coordinator (students) | Working |
| GET/POST | `/api/courses` | List / create courses | Bearer | role-aware / admin+coord | Working |
| GET/PATCH | `/api/courses/:id` | Get / update course | Bearer | role-aware / admin+coord | Working |
| PATCH | `/api/courses/:id/status` | draft/published/archived | Bearer | admin+coord | Working |
| GET/POST | `/api/courses/:courseId/modules` | List / create modules | Bearer | view / manage | Working |
| PATCH/DELETE | `/api/modules/:id` | Update / delete module | Bearer | manage | Working |
| POST | `/api/modules/:moduleId/lessons` | Create lesson | Bearer | manage | Working |
| GET | `/api/courses/:courseId/lessons` | List lessons | Bearer | published filter for students | Working |
| PATCH/DELETE | `/api/lessons/:id` | Update / delete lesson | Bearer | manage | Working |
| POST | `/api/lessons/:id/progress` | Mark access/complete | Bearer | student | Working |
| GET | `/api/courses/:id/progress` | Progress summary | Bearer | student | Working |
| GET/POST/PATCH | `/api/batches` | Batch list/create/update | Bearer | staff / admin+coord | Working |
| GET/POST/PATCH | `/api/enrollments` | Enrollments | Bearer | admin+coord / student me | Working |
| POST/GET | `/api/lessons/:lessonId/quiz` | Create / get quiz | Bearer | manage / role-aware | Working |
| POST | `/api/quizzes/:id/questions` | Add MCQ | Bearer | manage | Working |
| POST/GET | `/api/quizzes/:id/attempts` | Submit / list attempts | Bearer | student | Working |
| PATCH/DELETE | `/api/questions/:id` | Edit / delete question | Bearer | manage | Working |
| POST/GET | `/api/attendance/sessions` | Create / list sessions | Bearer | staff | Working |
| GET | `/api/attendance/sessions/:id` | Session + records | Bearer | role-scoped | Working |
| PUT | `/api/attendance/sessions/:id/records` | Upsert marks | Bearer | staff | Working |
| GET | `/api/attendance/me` | Student history | Bearer | student | Working |
| GET | `/api/admin/dashboard` | Admin aggregates (`?month=YYYY-MM`) | Yes | `admin` | Working |
| GET | `/api/coordinator/dashboard` | Coordinator aggregates | Yes | `admin`, `coordinator` | Working |
| GET | `/api/ustad/dashboard` | Ustad-scoped aggregates | Yes | `admin`, `coordinator`, `ustad` | Working |
| GET | `/api/student/dashboard` | Student enrollments + progress | Yes | `student` | Working |
| POST/GET | `/api/lessons/:lessonId/resources` | Upload / list lesson files | Bearer | manage / view | Working |
| GET | `/api/resources/:id` | Resource metadata | Bearer | view course | Working |
| GET | `/api/resources/:id/download` | Authenticated file stream | Bearer | view course | Working |
| DELETE | `/api/resources/:id` | Soft-delete + remove blob | Bearer | manage course | Working |

## Not present (expected gaps)

Hard delete of users, Subject collection, batch roster detail UI, rich quiz types, SMTP, Fee models, S3 provider implementation (local disk for demo). Lead CRUD is under `/api/leads`.

## Query notes (`GET /users`)

- `page`, `limit` (max 100), `search`, `role`, `isActive` (`true`/`false`), `sort` (`name`|`email`|`created`|`role`)
- Response `meta`: `{ page, limit, total, totalPages, stats: { total, active, inactive } }`

## Response notes

- Login returns `{ success, message, accessToken, user }` and sets HttpOnly refresh cookie.
- Passwords are never returned.
- Duplicate email → `409`.
- Self-deactivation → `400`.
