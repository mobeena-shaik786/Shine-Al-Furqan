# Role Matrix

Roles: `admin` | `coordinator` | `ustad` | `student`

Source of truth for **client** path visibility/guards: `client/src/config/routeAccess.ts`.  
Server dashboard stubs use `protect` + `authorizeRoles` on each route module.

## Backend API (`protect` + `authorizeRoles`)

| Endpoint | admin | coordinator | ustad | student |
|----------|:-----:|:-----------:|:-----:|:-------:|
| `GET /api/admin/dashboard` | yes | no | no | no |
| `GET /api/coordinator/dashboard` | yes | yes | no | no |
| `GET /api/ustad/dashboard` | yes | yes | yes | no |
| `GET /api/student/dashboard` | no | no | no | yes |
| Auth lifecycle (`/me`, change-password, …) | yes | yes | yes | yes |
| `GET/POST/PATCH /api/users` (admins, coords, ustads) | yes | no | no | no |
| `GET/POST/PATCH /api/users` (students) | yes | yes | no | no |

Inactive users (`isActive: false`) are rejected by `protect` with 401.

**User management rules (Phase 5):**
- Prefer deactivate over hard delete (`PATCH /users/:id/status`).
- Coordinators may only manage `role=student`.
- Actors cannot deactivate themselves.
- Covered by `server/tests/users.golden.test.ts`.

Covered by `server/tests/rbac.golden.test.ts` (full allow/deny matrix for dashboards).

## Frontend path access (`RoleProtectedRoute` + sidebar)

| Path prefix | admin | coordinator | ustad | student |
|-------------|:-----:|:-----------:|:-----:|:-------:|
| `/admin/dashboard` | yes | no | no | no |
| `/coordinator/dashboard` | yes | yes | no | no |
| `/ustad/dashboard` | yes | yes | yes | no |
| `/student/dashboard` | no | no | no | yes |
| `/users/admins` | yes | no | no | no |
| `/coordinators` (+ `/:id`) | yes | no | no | no |
| `/ustads` (+ `/:id`) | yes | no | no | no |
| `/students` (+ `/:id`) | yes | yes | no | no |
| `/leads` (+ `/:id`) | yes | yes | no | no |
| `/courses` (+ `/:id`) | yes | yes | yes | yes |
| `/subjects` | yes | yes | yes | no |
| `/batches` (+ `/:id`) | yes | yes | yes | no |
| `/classes` | yes | yes | yes | yes |
| `/attendance` | yes | yes | yes | yes |
| `/certificates` | yes | yes | yes | yes |
| `/fees` | yes | yes | no | no |
| `/salaries` | yes | no | no | no |
| `/reenrollments` | yes | yes | no | no |
| `/feedback` | yes | yes | yes | no |
| `/reports` | yes | yes | no | no |
| `/notifications` | yes | yes | yes | yes |
| `/settings` | yes | no | no | no |
| `/profile` | yes | yes | yes | yes |
| `/dashboard` (redirect) | yes | yes | yes | yes |

Wrong role → `/unauthorized`. Unauthenticated → `/login`.

Coming Soon pages use the same role matrix as implemented screens (direct URL still enforced).

## Navigation visibility

`getNavigationForRole(role)` filters `navigation` via `canAccessPath`. Empty groups are removed. Header Settings and sidebar Help Center link to `/settings` only when the role may open it.

Covered by `client/src/config/routeAccess.test.ts`.

## Independence rule

UI hiding and server authorization are consistent but independent — never trust a hidden button as security. Server middleware remains authoritative for APIs.
