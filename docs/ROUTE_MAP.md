# Route Map (Client)

Source of truth: `client/src/app/router.tsx` + `client/src/config/routeAccess.ts`

## Public

| Path | Component | Guard |
|------|-----------|-------|
| `/login` | `Login` | None |
| `/forgot-password` | `ForgotPasswordPage` | None |
| `/reset-password` | `ResetPasswordPage` | None |
| `*` | `NotFoundPage` | None |

## Authenticated (`ProtectedRoute` → `DashboardLayout`)

Role column: see `docs/ROLE_MATRIX.md` / `RouteRoles` in `routeAccess.ts`.

| Path | Component | Notes |
|------|-----------|-------|
| `/`, `/dashboard` | `RoleHomeRedirect` | Auth only → role home |
| `/admin/dashboard` | `AdminDashboard` | admin |
| `/coordinator/dashboard` | `CoordinatorDashboard` | admin, coordinator |
| `/ustad/dashboard` | `UstadDashboard` | staff |
| `/student/dashboard` | `StudentDashboard` | student |
| `/users/admins` | `AdminManagementPage` | admin |
| `/coordinators` | `CoordinatorManagementPage` | admin |
| `/coordinators/:id` | Coming Soon | admin |
| `/ustads` | `UstadManagementPage` | admin |
| `/ustads/:id` | Coming Soon | admin |
| `/students` | `StudentManagementPage` | admin, coordinator |
| `/students/:id` | Coming Soon | admin, coordinator |
| `/leads` | `LeadManagementPage` | admin, coordinator |
| `/leads/:id` | Coming Soon | admin, coordinator |
| `/courses`, `/courses/:id` | Coming Soon | all roles |
| `/subjects` | Coming Soon | staff |
| `/batches`, `/batches/:id` | Coming Soon | staff |
| `/classes` | Coming Soon | all roles |
| `/attendance` | Coming Soon | all roles |
| `/fees` | Coming Soon | admin, coordinator |
| `/salaries` | `SalaryManagementPage` | admin |
| `/certificates` | Coming Soon | all roles |
| `/reenrollments` | Coming Soon | admin, coordinator |
| `/feedback` | Coming Soon | staff |
| `/reports` | Coming Soon | admin, coordinator |
| `/notifications` | `NotificationsPage` | all roles |
| `/settings` | `SystemSettingsPage` | admin |
| `/profile` | `ProfilePage` | all authenticated |
| `/unauthorized` | `Unauthorized` | all authenticated |

## Redirects

| From | To |
|------|-----|
| `/teachers`, `/teachers/:id` | `/ustads` |
| `/parents` | `/coordinators` |

## Role homes (`getRoleHome`)

| Role | Home |
|------|------|
| admin | `/admin/dashboard` |
| coordinator | `/coordinator/dashboard` |
| ustad | `/ustad/dashboard` |
| student | `/student/dashboard` |
