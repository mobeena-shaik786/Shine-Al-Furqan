# Shine Al Furqan LMS — Master Audit-to-Production Implementation Plan

> **Purpose:** This document is the master execution prompt and phased engineering plan for Cursor/AI agents working on the Shine Al Furqan LMS repository.
>
> **Operating rule:** Do not jump directly into coding. Every phase must execute the full Standard Loop in this file: **Discover Context → Plan → Agent Execution → Testing → Bug-Fix / Testing Loop → Document Updating**.
>
> **Current audited state:** The project already has a strong React/TypeScript admin shell and a Node/Express/TypeScript authentication and RBAC skeleton, but most LMS-domain features are missing or mocked. User management UI is largely local/mock state, admin dashboard values are mocked, forgot/reset password is UI-only, refresh-token infrastructure is incomplete, and the repository has important secret/configuration hygiene gaps. The project should currently be treated as **DEMO READY**, not MVP-ready or production-ready.

---

# 0. Non-Negotiable Engineering Rules

These rules apply to **every phase** and override convenience-driven implementation decisions.

1. **Inspect before editing.** Never assume the repository still matches a previous audit, generated plan, chat response, README, or old Cursor context.
2. **Current code is the source of truth.** Documentation is supporting evidence, not authority, when it disagrees with runtime behavior.
3. **No blind rewrites.** Existing working behavior should be preserved unless the phase explicitly replaces it and regression tests prove the replacement.
4. **No unrelated refactors.** If a phase is about authentication, do not also redesign course cards, folder structure, theme tokens, or unrelated components.
5. **Every phase has a measurable gate.** A phase is not “done” because files were changed. It is done only when the phase gate is demonstrably satisfied.
6. **Prefer vertical slices.** Whenever possible, complete backend + frontend + validation + tests for a small real workflow before expanding horizontally.
7. **No mock/real ambiguity.** If a screen still uses mock data, it must be clearly labeled in code and, when visible to users, clearly indicated in the UI.
8. **Server validation is mandatory.** Frontend validation improves UX; backend validation protects the system.
9. **Authorization is server-enforced.** Hiding buttons is not authorization.
10. **Never expose secrets.** Do not print `.env` values, JWT secrets, database URIs, reset tokens, refresh-token hashes, or passwords in logs, generated docs, tests, or chat output.
11. **Prefer fail-fast production configuration.** A missing production secret should stop startup rather than silently falling back.
12. **Every write endpoint needs negative-path tests.** At minimum: unauthenticated, unauthorized, invalid input, nonexistent ID, and duplicate/conflict where applicable.
13. **Every user-visible async workflow needs loading, success, empty, and error behavior.**
14. **Never claim persistence without persistence.** React state is not saved data.
15. **Keep the app runnable between increments.** Avoid large half-applied migrations.
16. **Do not defer discovered bugs silently.** Either fix them in scope or log them in the project gap/technical-debt documentation with reason and impact.
17. **Do not upgrade dependencies casually.** Dependency upgrades require a stated reason, compatibility check, and regression run.
18. **Do not introduce a new architectural pattern if an existing pattern fits.** If a new pattern is necessary, document why.
19. **Protect role boundaries with tests.** `admin`, `coordinator`, `ustad`, and `student` must be tested as distinct identities.
20. **Documentation changes belong in the same phase as behavior changes.**

---

# 1. Current Baseline From the Audit

The implementation plan below assumes the following audited baseline. Re-check it in Phase 1 before relying on it.

## Client

- Vite + React + TypeScript.
- Tailwind-based UI.
- React Router-based protected routes.
- React Hook Form + Zod present for form validation.
- Axios client/interceptors present.
- Redux Toolkit exists, but authentication is primarily handled through context and some RTK pieces are incomplete/unused.
- Admin dashboard is visually strong but backed by mock data.
- Admin/coordinator/ustad/student management screens are largely mock/local-state CRUD.
- Forgot-password and reset-password screens are UI-only/mock.
- Course-related navigation exists but much of the domain is not implemented.
- Sidebar/navigation is not sufficiently role-filtered.

## Server

- Express + TypeScript.
- Mongoose/MongoDB.
- JWT authentication.
- bcrypt password hashing.
- Zod validation.
- Helmet, CORS, rate limiting, Morgan.
- Authentication middleware and role authorization middleware exist.
- `User` model exists.
- `RefreshToken` model exists but refresh-token flow is incomplete or unused.
- Role dashboard endpoints are stubs.
- LMS domain APIs are mostly missing.
- Seed logic exists and includes demo credential concerns.
- Environment configuration includes unsafe fallback behavior that must be hardened.

## Data / Product

- Only the user/auth foundation is substantially real.
- Courses, lessons, enrollments, progress, quizzes, attendance, reporting, and richer academic workflows are not yet backed by a complete persistent domain model.
- Product should be considered a **demoable portal shell**, not a complete LMS.

---

# 2. Definition of Done for the Entire Program

The full program is complete only when all of the following are true:

- Secrets/configuration are production-safe.
- Authentication lifecycle is complete.
- Role authorization is consistently enforced on server and reflected in UI navigation.
- Real user-management APIs replace local mock CRUD.
- Course/domain models exist and are persisted.
- Course authoring is real.
- Learning content is real.
- Enrollment is real.
- Student progress is real.
- Quiz/assessment workflows are real.
- Role dashboards read real data.
- Attendance/reporting workflows are implemented if retained in the product scope.
- Frontend and backend validation are consistent.
- Automated tests cover critical success and failure flows.
- Runtime logging, monitoring, backup strategy, configuration, and deployment posture support production.
- Documentation accurately describes what the application actually does.
- There is a reproducible regression suite.
- There are no known Critical or High production blockers.

---

# The Standard Loop (apply to every phase below)

## 1. Discover Context

Before writing a line of code for this phase:

- Re-read the **actual current source** for every file this phase may touch. Do not rely on a prior audit, generated plan, or earlier agent summary.
- Re-read the project audit and any existing project truth/gap documents relevant to this phase.
- Search for all usages before removing, renaming, or changing a shared function, model field, API route, context value, component, env variable, or type.
- Re-check `package.json` files before assuming a package is available or unused.
- If the phase depends on database state, inspect the current models, indexes, seed behavior, and representative database records through the project’s existing safe tools/scripts.
- If the phase changes APIs, inspect both server routes and every frontend call site before proposing the API contract.
- If the phase changes authorization, inspect route guards, navigation visibility, server middleware, and actual role values in the user model.
- If the phase changes environment behavior, inspect `.env.example`, `.gitignore`, config loaders, deployment files, and startup scripts.
- If the phase changes a user-visible flow, inspect the current loading, empty, success, validation, error, and unauthorized states for that flow.
- Write a concise **Current State Note** before proposing changes. The note must say what is real, what is mock, what is partial, and what risks were confirmed.

## 2. Plan

Before implementation:

- Restate this phase’s **gate criteria** in your own words.
- List every file expected to be touched and classify each as:
  - `READ-ONLY REFERENCE`
  - `SMALL EDIT`
  - `MAJOR EDIT`
  - `NEW FILE`
  - `DELETE ONLY AFTER USAGE CHECK`
- List the backend contract changes, if any.
- List the frontend contract changes, if any.
- List database/schema/index changes, if any.
- List migrations/backfill/seed impact, if any.
- List security implications.
- List tests that must exist before the phase can close.
- Flag every unresolved decision. Pick a conservative default only when necessary, mark it explicitly as a **DEFAULT**, and avoid presenting it as a requirement from the product spec.
- Identify rollback/recovery considerations for destructive or schema-affecting work.

## 3. Agent Execution

- Implement in the smallest increments that each leave the app runnable.
- Follow established repository patterns unless there is a documented reason not to.
- Keep authentication, authorization, validation, persistence, business logic, and presentation concerns separated.
- Prefer typed request/response contracts.
- Avoid giant files when a cohesive service/module boundary already exists or naturally emerges.
- Do not create abstractions purely for aesthetics; create them when duplication, testability, ownership, or domain boundaries justify them.
- Preserve backwards compatibility during transitional steps when frontend and backend cannot be switched atomically.
- Remove mocks only after the real path works.
- Do not delete deprecated code until all imports/usages are confirmed gone and regression tests pass.

## 4. Testing

At minimum for every phase:

- Run the relevant existing test suite before edits to establish baseline behavior.
- Add or update automated tests for the new logic.
- Run success-path tests.
- Run negative-path tests.
- Manually verify at least one realistic user flow affected by the phase.
- Verify authorization using multiple roles when applicable.
- Verify persistence by refreshing/restarting where applicable.
- Verify errors are not leaking secrets/internal stack traces in production-style responses.
- Verify frontend loading/error/empty states where applicable.
- If the phase touches hot APIs, dashboard aggregation, uploads, or bulk reads, record a simple performance observation rather than assuming it remains acceptable.

## 5. Bug-Fix / Testing Loop

- Treat the first test run as discovery.
- Log every failing test and every surprising passing behavior.
- Fix one root cause at a time.
- Re-run the smallest relevant tests after each fix.
- Re-run the broader regression suite before closing the phase.
- Do not move forward with a known in-scope bug.
- If a bug is intentionally deferred because it belongs to a later phase, document:
  - what the bug is,
  - user impact,
  - technical impact,
  - why it is safe to defer,
  - which phase owns it.
- Re-check the phase gate after the final test run.

## 6. Document Updating

At the end of every phase:

- Update the project’s current-state/truth documentation with what is now actually implemented.
- Update the gap/roast/technical-debt document:
  - move fixed items to a Fixed section,
  - add newly discovered gaps,
  - remove stale claims.
- Update `USER_MANUAL.md` or equivalent whenever user-visible behavior changes.
- Update `.env.example` when configuration requirements change.
- Update README/setup docs when startup, scripts, ports, commands, seeding, or dependencies change.
- Update API documentation when an endpoint or response shape changes.
- Update role/permission documentation when access rules change.
- Cross-check old docs for conflicting statements.
- End the phase with a short **Phase Closure Note** containing:
  - gate result,
  - files changed,
  - tests run,
  - manual checks performed,
  - known deferred items,
  - next phase readiness.

---

# Phase 1 — Establish a Reproducible Baseline and Golden Regression Set

## Objective

Create a trustworthy baseline before hardening or replacing behavior. This phase exists to prevent later agents from accidentally changing unrelated functionality while believing they are only working on one subsystem.

## Gate Criteria

Phase 1 is complete only when:

- The repository can be started using documented commands.
- Client and server test baselines are recorded.
- The current route map is documented.
- The current role matrix is documented.
- The current API endpoint inventory is documented.
- A small golden regression set exists for the most important current behaviors.
- Mock vs real behavior is explicitly identified.
- No production behavior is intentionally changed except tiny testability/documentation fixes required to establish the baseline.

## Standard Loop — Phase 1

### 1. Discover Context

- Read root, client, and server package manifests.
- Read client router configuration and protected-route implementation.
- Read server app/router registration.
- Read auth middleware and user role enum/model.
- Read auth context/store/interceptor behavior.
- Read current tests.
- Read mock-dashboard services and management-page mock data.
- Confirm which pages are stubs, mock-backed, or real.
- Confirm actual local start commands and ports.

Write a Current State Note covering:
- startup path,
- auth path,
- API prefixing,
- role values,
- mock boundaries,
- current tests.

### 2. Plan

Expected outputs:
- baseline document,
- endpoint inventory,
- role matrix,
- golden-flow checklist,
- possibly small test fixtures or helper utilities.

Define a golden user set representing:
- admin,
- coordinator,
- ustad,
- student.

Define golden flows:
1. Successful login.
2. Failed login.
3. `/me` session restore.
4. Admin dashboard authorization.
5. Student denied from an admin-only API.
6. Client protected route redirect.
7. Role dashboard reachability.
8. Health endpoint.

### 3. Agent Execution

- Add only the minimum test scaffolding required.
- Do not convert mocks to real data in this phase.
- Do not redesign routes.
- Do not restructure folders.
- Document observed current behavior exactly.

### 4. Testing

- Run server tests.
- Run client tests.
- Run lint/type-check commands if configured.
- Manually execute the golden flows.
- Record failures separately from expected limitations.

### 5. Bug-Fix / Testing Loop

Only fix blockers preventing reproducible baseline testing. Defer product changes to later phases.

### 6. Document Updating

Create/update:
- current-state truth document,
- API inventory,
- role matrix,
- test baseline,
- mock-vs-real matrix.

## Phase 1 Exit Deliverable

A new agent should be able to enter the repository and know exactly:
- how to run it,
- what currently works,
- what is mocked,
- which regression flows must never silently break.

---

# Phase 2 — Repository Hygiene, Secrets, Environment Safety, and Demo Credential Cleanup

## Objective

Remove the highest-risk configuration and repository hygiene problems before feature development expands the attack surface.

## Gate Criteria

- Real `.env` files cannot be accidentally committed through normal Git use.
- Server startup does not silently use a weak/fallback JWT secret in production.
- Production-required variables are validated and fail fast.
- Demo passwords are not printed to normal logs.
- Demo credentials are not unintentionally prefilled in normal production login UI.
- Seed behavior is explicit and environment-safe.
- Example environment files document required keys without containing real secrets.

## Standard Loop — Phase 2

### 1. Discover Context

Inspect:
- every `.gitignore`,
- `.env.example` files,
- config/env loader,
- seed scripts,
- server startup/database connect code,
- login default values,
- logging statements mentioning seed credentials,
- deployment/start scripts if present.

Search for:
- `JWT_SECRET`,
- `MONGO`,
- `PASSWORD`,
- `SECRET`,
- demo emails,
- hardcoded tokens,
- fallback strings.

Do not print secret values in the Current State Note.

### 2. Plan

Classify fixes:
- secret-ignore strategy,
- env schema validation,
- development defaults vs production requirements,
- seed execution strategy,
- demo-login behavior.

**DEFAULT:** Development may use explicit non-sensitive defaults only for harmless settings such as local port; security credentials must still be supplied explicitly.

### 3. Agent Execution

- Add root/server/client ignore coverage as appropriate.
- Ensure `.env`, `.env.local`, environment-specific real files, logs, coverage, build artifacts, and relevant temporary files are excluded.
- Replace production JWT fallback behavior with schema validation/fail-fast behavior.
- Make seed execution opt-in or clearly development-scoped.
- Remove password logging.
- Remove production-facing prefilled credentials or gate them behind an explicit development/demo mode.
- Keep `.env.example` values clearly non-secret placeholders.

### 4. Testing

- Start server with correct env: must succeed.
- Start production-mode server missing required secret: must fail clearly.
- Run seed in allowed environment: must work without printing passwords.
- Verify login still works with seeded users.
- Verify ignored real env files are not tracked by a fresh Git status flow.

### 5. Bug-Fix / Testing Loop

Watch for:
- env loader accidentally rejecting test environments,
- test suite depending on old fallback secret,
- seed scripts running automatically in unintended environments.

### 6. Document Updating

Update:
- setup guide,
- env variable documentation,
- seed instructions,
- security/truth documents.

---

# Phase 3 — Authentication Lifecycle Completion

> **Status:** Complete — see [`docs/PHASE_3_CLOSURE.md`](docs/PHASE_3_CLOSURE.md)

## Objective

Turn the existing login/session shell into a complete authentication lifecycle suitable for a real LMS.

## Gate Criteria

- Login works securely.
- Session restoration works.
- Logout has a meaningful server-side lifecycle strategy.
- Token expiry is handled predictably.
- Refresh-token or secure-cookie strategy is fully implemented or explicitly rejected with documented rationale.
- Forgot password is real.
- Reset password is real.
- Change password is real for authenticated users.
- Password policy is consistent across creation/change/reset flows.
- Password reset tokens are single-use and time-limited.

## Standard Loop — Phase 3

### 1. Discover Context

Inspect:
- auth routes,
- auth service,
- JWT helpers,
- refresh-token model,
- cookie parser usage,
- client auth context,
- axios interceptors,
- login/forgot/reset pages,
- validation schemas,
- User password hooks/methods.

Confirm whether the current client stores JWT in `localStorage` and exactly how 401 responses are handled.

### 2. Plan

Choose and document one coherent strategy.

Preferred production direction:
- short-lived access token,
- refresh token in secure HttpOnly cookie,
- refresh token persisted as a hash or revocable server-side record,
- rotation/revocation policy.

If the repository architecture strongly favors another strategy, document why.

Define endpoints such as:
- login,
- logout,
- refresh,
- forgot-password,
- reset-password,
- change-password,
- me.

**DEFAULT:** Exact token TTLs are engineering defaults until product/security requirements specify them. Mark them clearly.

### 3. Agent Execution

Implement incrementally:
1. shared password policy,
2. change-password backend + test,
3. reset token generation/storage strategy,
4. forgot-password request behavior,
5. reset-password behavior,
6. refresh flow,
7. logout revocation,
8. client token lifecycle handling,
9. UI wiring.

Do not expose whether an email exists in forgot-password responses.

### 4. Testing

Test:
- correct login,
- wrong password,
- malformed email,
- inactive account,
- expired access token,
- valid refresh,
- invalid/revoked refresh,
- logout then refresh denied,
- forgot password for existing/non-existing email produces safe equivalent response,
- valid reset token,
- expired reset token,
- reused reset token,
- change-password wrong current password,
- login using new password after reset/change.

### 5. Bug-Fix / Testing Loop

Pay attention to race conditions in refresh rotation and duplicate refresh requests from the browser.

### 6. Document Updating

Update:
- auth flow docs,
- environment requirements,
- API docs,
- user manual forgot/reset/change password sections,
- security notes.

---

# Phase 4 — Authorization and Role-Aware Navigation Hardening

> **Status:** Complete — see [`docs/PHASE_4_CLOSURE.md`](docs/PHASE_4_CLOSURE.md)

## Objective

Make role access consistent across server APIs, client routes, navigation, and user-visible controls.

## Gate Criteria

- Every privileged server route has explicit authorization.
- Students cannot reach admin/coordinator/ustad management APIs.
- Client navigation only presents role-appropriate destinations.
- Direct URL entry still results in correct authorization behavior.
- UI hiding and server authorization are consistent but independent.
- Role matrix is covered by automated tests.

## Standard Loop — Phase 4

### 1. Discover Context

Inspect:
- role enum,
- `authorizeRoles` usage,
- server route registration,
- protected route wrappers,
- sidebar/navigation configuration,
- dashboard routes,
- Coming Soon routes,
- action buttons in management screens.

Build a current permission matrix.

### 2. Plan

Define target permissions for:
- admin,
- coordinator,
- ustad,
- student.

Distinguish:
- route visibility,
- read permission,
- create permission,
- update permission,
- delete/deactivate permission,
- academic operational permissions.

### 3. Agent Execution

- Centralize route metadata where practical.
- Filter navigation by role/permission.
- Add role-aware protected route handling.
- Ensure server route middleware enforces the actual rule.
- Avoid trusting role values supplied by the client.
- Prefer database-backed current role where the existing architecture already does so.

### 4. Testing

Create a role matrix test set for every existing protected endpoint.

Manual UI checks:
- login as each role,
- inspect sidebar,
- try direct URLs,
- try API requests directly.

### 5. Bug-Fix / Testing Loop

Treat “hidden button but callable API” as a critical failure.

### 6. Document Updating

Update:
- role matrix,
- navigation documentation,
- API authorization docs,
- user manual role-specific sections.

---

# Phase 5 — Real User Management APIs and Removal of Fake CRUD

> **Status:** Complete — see [`docs/PHASE_5_CLOSURE.md`](docs/PHASE_5_CLOSURE.md)

## Objective

Replace local/mock user-management behavior with real persisted backend APIs.

## Gate Criteria

- Admin user-management pages load users from MongoDB.
- Create user persists.
- Edit user persists.
- Activate/deactivate persists.
- Delete behavior is explicitly designed; prefer deactivate/soft-delete if product history requires preservation.
- Duplicate email conflicts are handled.
- Role permissions are enforced.
- Pagination/search/filter exist before datasets become large.
- Refreshing the browser does not lose user changes.

## Standard Loop — Phase 5

### 1. Discover Context

Inspect:
- User model,
- user management pages,
- Add* modals,
- local mock arrays,
- service layer conventions,
- API response helpers,
- current auth role restrictions.

Identify repeated frontend management patterns.

### 2. Plan

Define user API contract, for example:
- `GET /users`
- `GET /users/:id`
- `POST /users`
- `PATCH /users/:id`
- `PATCH /users/:id/status`

Define pagination/search/filter query parameters.

Define who can manage which roles.

### 3. Agent Execution

Backend first:
- validation schemas,
- service methods,
- routes/controllers according to established pattern,
- safe response projection,
- duplicate handling,
- pagination.

Frontend next:
- API service,
- loading/error/empty states,
- replace local mutation with server mutations,
- refetch/update cache after changes,
- preserve form UX.

Only remove mock arrays after real flow passes.

### 4. Testing

Test:
- list pagination,
- role filter,
- search,
- create each allowed role,
- duplicate email,
- invalid role,
- unauthorized create/edit,
- self-deactivation constraints if applicable,
- persistence across refresh.

### 5. Bug-Fix / Testing Loop

Watch for stale client state after mutation and role-escalation vulnerabilities.

### 6. Document Updating

Update API docs, admin manual, truth/gap docs, mock-vs-real matrix.

---

# Phase 6 — Domain Architecture: Course, Module, Lesson, Batch, and Academic Ownership Models

> **Status:** Complete — see [`docs/PHASE_6_CLOSURE.md`](docs/PHASE_6_CLOSURE.md) and [`docs/DOMAIN_MODEL.md`](docs/DOMAIN_MODEL.md)

## Objective

Define and implement the minimum durable LMS/academy domain model before building screens on top of unstable schemas.

## Gate Criteria

- Core domain entities and relationships are explicitly documented.
- Course ownership/instructor assignment is represented.
- Module/lesson ordering is represented.
- Batch/cohort concept is either implemented or explicitly excluded.
- Model indexes support expected lookups.
- Validation prevents obviously invalid relationships.
- No unnecessary duplicated denormalized data is introduced without reason.

## Standard Loop — Phase 6

### 1. Discover Context

Inspect:
- navigation labels,
- existing mock UI fields,
- dashboard terminology,
- user roles,
- any existing batch/course types,
- any seeded/mock course data.

Do not blindly impose a generic LMS schema if this academy portal actually needs batch-based teaching.

### 2. Plan

Define entities. A reasonable starting point may include:

### Course
- title
- slug/code
- description
- category
- thumbnail
- status: draft/published/archived
- instructor/ustad references
- createdBy
- timestamps

### Module
- courseId
- title
- order

### Lesson
- courseId
- moduleId
- title
- lesson type
- content/resource metadata
- order
- duration estimate
- publication state

### Batch / Cohort (if product requires it)
- name
- courseId
- assigned ustad(s)
- schedule metadata
- capacity
- start/end dates
- status

Flag exact fields as DEFAULT unless already supported by existing product screens/spec.

### 3. Agent Execution

- Create models and validation.
- Add required indexes.
- Add basic domain service functions.
- Add model/service tests.
- Do not build the full frontend yet.

### 4. Testing

Test:
- invalid references,
- duplicate slug/code strategy,
- ordering values,
- archive/publish states,
- ownership rules.

### 5. Bug-Fix / Testing Loop

Resolve schema ambiguity before large frontend work begins.

### 6. Document Updating

Add an ER/domain relationship section and field glossary.

---

# Phase 7 — Course CRUD and Instructor Assignment Vertical Slice

> **Status:** Complete — see [`docs/PHASE_7_10_CLOSURE.md`](docs/PHASE_7_10_CLOSURE.md)

## Objective

Deliver the first complete real LMS vertical slice: admins/coordinators can manage courses and assign instructors; authorized users can read appropriate course data.

## Gate Criteria

- Course list is real.
- Course create/edit/archive is real.
- Instructor assignment is real.
- Draft/published behavior is enforced.
- Unauthorized roles cannot mutate courses.
- Frontend course screens no longer point only to Coming Soon for this slice.

## Standard Loop — Phase 7

### 1. Discover Context

Inspect existing Coming Soon course routes, navigation, mock cards, user selection UI, and new course model/services from Phase 6.

### 2. Plan

Define:
- admin list endpoint,
- public/student published-course read endpoint if needed,
- create/update/archive endpoints,
- instructor assignment behavior,
- pagination/search/category/status filters.

### 3. Agent Execution

Backend → frontend in small increments.

Add:
- course list page,
- create/edit form,
- status badge,
- instructor selector,
- empty/loading/error states,
- role-aware actions.

### 4. Testing

Test:
- create valid course,
- missing title,
- invalid instructor role,
- publish/archive transitions,
- unauthorized mutation,
- persistence after refresh.

### 5. Bug-Fix / Testing Loop

Check course assignment and filtering for stale references.

### 6. Document Updating

Update user manual and API docs with real course behavior.

---

# Phase 8 — Module and Lesson Authoring

> **Status:** Complete — see [`docs/PHASE_7_10_CLOSURE.md`](docs/PHASE_7_10_CLOSURE.md)

## Objective

Allow authorized staff to structure a course into modules and lessons with deterministic ordering.

## Gate Criteria

- Modules can be created, renamed, reordered, and removed safely.
- Lessons can be created, edited, reordered, published/unpublished, and removed/archived safely.
- Lesson order persists.
- Students cannot access unpublished content.
- Instructor editing rights follow the permission matrix.

## Standard Loop — Phase 8

### 1. Discover Context

Inspect existing course detail UI and content-related placeholders.

### 2. Plan

Define supported lesson types for the MVP.

**DEFAULT MVP types:**
- text,
- external video URL,
- downloadable resource metadata.

Do not implement complex uploads until the upload-security phase unless the repository already has a safe storage system.

### 3. Agent Execution

Implement module CRUD, lesson CRUD, ordering, publication state, and course-builder UI.

### 4. Testing

Test:
- reorder persistence,
- cross-course module/lesson ID tampering,
- unpublished access,
- deletion rules,
- empty course behavior.

### 5. Bug-Fix / Testing Loop

Pay special attention to race conditions in reorder APIs.

### 6. Document Updating

Update instructor/admin manual and domain docs.

---

# Phase 9 — Enrollment and Batch Membership

> **Status:** Complete — see [`docs/PHASE_7_10_CLOSURE.md`](docs/PHASE_7_10_CLOSURE.md)

## Objective

Implement the real relationship between students and courses/batches.

## Gate Criteria

- Enrollment persists.
- Duplicate enrollment is prevented.
- Invalid course/student references are rejected.
- Enrollment status lifecycle is defined.
- Students only see courses they are allowed to access.
- Admin/coordinator assignment UI is real.

## Standard Loop — Phase 9

### 1. Discover Context

Inspect dashboard mock “recent enrollments,” student management pages, course/batch model, and role rules.

### 2. Plan

Define Enrollment fields, likely:
- studentId,
- courseId,
- batchId optional,
- status,
- enrolledAt,
- completedAt optional,
- source/createdBy if useful.

Add unique compound index such as student+course(+batch depending on domain rule).

### 3. Agent Execution

Create enrollment model, service, endpoints, assignment UI, and student course query.

### 4. Testing

Test:
- first enrollment,
- duplicate enrollment,
- inactive student,
- archived course,
- unauthorized assignment,
- unenroll/archive semantics,
- persistence.

### 5. Bug-Fix / Testing Loop

Check whether deleting/archiving a course breaks enrollment history.

### 6. Document Updating

Update enrollment lifecycle docs and student manual.

---

# Phase 10 — Student Learning Experience and Progress Tracking

> **Status:** Complete — see [`docs/PHASE_7_10_CLOSURE.md`](docs/PHASE_7_10_CLOSURE.md)

## Objective

Deliver a real student learning workflow: open enrolled course, navigate lessons, mark/record completion, and resume progress.

## Gate Criteria

- Student dashboard lists real enrolled courses.
- Student can open only authorized content.
- Lesson completion persists.
- Course progress percentage is derived consistently.
- Resume-learning behavior works.
- Completion calculations handle added/removed lessons predictably.

## Standard Loop — Phase 10

### 1. Discover Context

Inspect current student dashboard stub, course/lesson APIs, enrollment model, and UI components available for progress display.

### 2. Plan

Define Progress model/strategy.

Possible design:
- per-student per-lesson progress record,
- completion timestamp,
- lastAccessedAt,
- optional position metadata for future video resume.

Define progress percentage formula and edge behavior.

### 3. Agent Execution

Implement:
- student course page,
- lesson viewer,
- complete/uncomplete semantics if allowed,
- progress aggregation,
- resume endpoint/UI.

### 4. Testing

Test:
- unenrolled access denied,
- unpublished lesson denied,
- complete lesson,
- duplicate complete idempotency,
- progress percentage,
- course with zero lessons,
- lesson added after prior completion.

### 5. Bug-Fix / Testing Loop

Watch for inconsistent percentages between dashboard and course detail.

### 6. Document Updating

Document exact progress calculation and resume behavior.

---

# Phase 11 — Quiz and Assessment MVP

> **Status:** Complete — see [`docs/PHASE_11_12_CLOSURE.md`](docs/PHASE_11_12_CLOSURE.md) and [`docs/QUIZ_RULES.md`](docs/QUIZ_RULES.md)

## Objective

Implement a safe and testable quiz workflow without leaking answer keys to students.

## Gate Criteria

- Authorized staff can create quiz questions.
- Student receives quiz content without correct-answer metadata.
- Student can submit answers.
- Server calculates score.
- Attempt history persists.
- Pass/fail rule is defined.
- Student cannot alter score client-side.

## Standard Loop — Phase 11

### 1. Discover Context

Inspect lesson model to determine whether quiz belongs to course, module, or lesson.

### 2. Plan

MVP question type:
- single-answer multiple choice.

Define:
- Quiz,
- Question,
- Attempt,
- score calculation,
- pass threshold,
- attempt limit behavior.

**DEFAULT:** Unlimited attempts or a simple configured limit unless product requirements already specify otherwise.

### 3. Agent Execution

Keep correct answers server-only. Create authoring UI and student attempt UI.

### 4. Testing

Test:
- answer key not present in student GET response,
- empty submission,
- invalid option IDs,
- exact score calculation,
- unauthorized quiz modification,
- repeated attempt behavior.

### 5. Bug-Fix / Testing Loop

Treat any answer-key leak as Critical.

### 6. Document Updating

Document scoring and attempt rules.

---

# Phase 12 — Attendance and Academy Operations

> **Status:** Complete (Path A — implemented) — see [`docs/PHASE_11_12_CLOSURE.md`](docs/PHASE_11_12_CLOSURE.md)

## Objective

Implement attendance only if it remains a real Shine Al Furqan requirement; otherwise formally remove or defer the misleading UI/navigation.

## Gate Criteria

Either:

### Path A — Implement
- Attendance sessions are linked to a batch/course/date.
- Authorized ustad/coordinator can record attendance.
- Student attendance history is readable by permitted roles.
- Duplicate records are prevented.

### Path B — Defer
- Attendance navigation is clearly marked unavailable or removed from production navigation.
- Documentation states it is deferred.

## Standard Loop — Phase 12

### 1. Discover Context

Inspect all attendance labels, mock data, dashboard widgets, and expected academy workflow.

### 2. Plan

If implementing, define Session and AttendanceRecord models or an equivalent normalized design.

### 3. Agent Execution

Implement the minimum workflow only.

### 4. Testing

Test duplicate day/session records, unauthorized edits, student visibility, and batch membership constraints.

### 5. Bug-Fix / Testing Loop

Check timezone/date-boundary behavior carefully.

### 6. Document Updating

Update manual and truth docs to clearly state implemented vs deferred scope.

---

# Phase 13 — Real Dashboards and Reporting Aggregations

## Objective

Replace dashboard mock data with real aggregates and role-relevant information.

## Gate Criteria

- Admin dashboard uses real data.
- Coordinator dashboard uses real data.
- Ustad dashboard uses real data.
- Student dashboard uses real data.
- Expensive aggregates are bounded and indexed.
- Empty states are meaningful.
- Dashboard metrics are defined, not vague.

## Standard Loop — Phase 13

### 1. Discover Context

Inspect `mockDashboard` behavior, dashboard cards/charts, and all newly real domain models.

### 2. Plan

For every metric, define:
- exact meaning,
- source collection/model,
- time window,
- role filter,
- whether it is count, unique count, average, or rate.

Do not keep labels like “active students” without defining “active.”

### 3. Agent Execution

Build aggregation endpoints and replace one dashboard section at a time.

### 4. Testing

Seed known small datasets and assert exact counts.

### 5. Bug-Fix / Testing Loop

Investigate surprising-but-valid totals rather than only failing tests.

### 6. Document Updating

Create dashboard metric definitions in docs and user manual.

---

# Phase 14 — File Uploads and Learning Resources Security

## Objective

Introduce uploads only with explicit storage, validation, authorization, and abuse controls.

## Gate Criteria

- Allowed file types are explicit.
- Size limits exist.
- Filename handling is safe.
- Storage paths/keys do not trust user input.
- Access control is enforced.
- Upload metadata is persisted.
- Deletion behavior is defined.
- Production storage strategy is documented.

## Standard Loop — Phase 14

### 1. Discover Context

Check whether any upload middleware/storage already exists. If not, do not assume local disk is production-appropriate.

### 2. Plan

Choose storage strategy appropriate to deployment.

Define MIME/type/size rules.

### 3. Agent Execution

Implement upload service behind an abstraction only if it improves deployment portability.

### 4. Testing

Test:
- allowed type,
- disallowed type,
- oversized upload,
- path traversal attempts,
- unauthorized upload/download,
- deleted resource behavior.

### 5. Bug-Fix / Testing Loop

Treat unrestricted executable/script upload exposure as Critical.

### 6. Document Updating

Update deployment, security, and instructor manuals.

---

# Phase 15 — API Consistency, Validation, Error Contracts, and Observability

## Objective

Standardize the application after core workflows exist so operational behavior is predictable.

## Gate Criteria

- API success/error envelopes are consistent or intentionally documented.
- Status codes are correct.
- All write endpoints validate input on server.
- Object ID validation is consistent.
- Central error handling covers expected failure classes.
- Production errors do not leak internal stack traces.
- Request logging is useful and does not include secrets.
- Request correlation/request IDs exist if practical.

## Standard Loop — Phase 15

### 1. Discover Context

Inventory response shapes, error helpers, manual try/catch patterns, Zod schemas, and logging.

### 2. Plan

Define one API response/error convention.

Example error fields:
- success: false,
- code,
- message,
- fieldErrors optional,
- requestId optional.

### 3. Agent Execution

Migrate incrementally. Do not break every frontend call in one untested sweep.

### 4. Testing

Contract-test representative endpoints from every major module.

### 5. Bug-Fix / Testing Loop

Watch for frontend assumptions about old error strings.

### 6. Document Updating

Publish the API contract and error-code guide.

---

# Phase 16 — Frontend Architecture Cleanup After Real APIs Exist

## Objective

Refactor the frontend only after real usage patterns are visible, reducing duplication without prematurely abstracting mock-era assumptions.

## Gate Criteria

- Repeated admin management table logic is sensibly shared.
- Repeated modal/form patterns are sensibly shared.
- Authentication has one coherent state ownership strategy.
- Dead/deprecated re-export files are removed after usage verification.
- Empty RTK/API shells are either used or removed.
- Route-level lazy loading is considered/implemented where beneficial.
- No behavior regression.

## Standard Loop — Phase 16

### 1. Discover Context

Measure actual duplication now that real APIs are wired.

### 2. Plan

Candidates:
- shared DataTable,
- shared pagination controls,
- shared form fields,
- feature-scoped hooks,
- centralized API query layer,
- route lazy loading.

Do not force a single abstraction across genuinely different management workflows.

### 3. Agent Execution

Refactor one repeated pattern at a time.

### 4. Testing

Regression-test all affected management pages and forms.

### 5. Bug-Fix / Testing Loop

Treat visual/functionality drift as a regression even if TypeScript compiles.

### 6. Document Updating

Update frontend architecture docs and remove outdated pattern references.

---

# Phase 17 — Accessibility, Responsive UX, and Honest Product States

## Objective

Ensure the interface remains understandable and usable across roles, devices, keyboard navigation, and failure states.

## Gate Criteria

- Keyboard navigation works for major flows.
- Dialogs handle focus appropriately.
- Forms have accessible labels and errors.
- Contrast is acceptable.
- Mobile layouts are usable.
- Tables have a small-screen strategy.
- Mock/demo labels are gone where real data exists.
- Remaining unavailable features are clearly labeled rather than pretending to work.

## Standard Loop — Phase 17

### 1. Discover Context

Audit login, dashboards, tables, modals, lesson viewer, quiz UI, and mobile sidebar.

### 2. Plan

Create a prioritized accessibility/UX checklist.

### 3. Agent Execution

Fix critical keyboard/form/modal problems first, then responsive issues, then polish.

### 4. Testing

Manual keyboard pass plus responsive viewport checks.

### 5. Bug-Fix / Testing Loop

Include confusing UX behavior as bugs, not only crashes.

### 6. Document Updating

Update user manual screenshots/instructions if maintained.

---

# Phase 18 — Automated Test Expansion and Critical Flow E2E Coverage

## Objective

Create a regression safety net covering the system users actually depend on.

## Gate Criteria

- Auth API has strong integration coverage.
- Role authorization matrix is tested.
- User CRUD is tested.
- Course CRUD is tested.
- Enrollment is tested.
- Progress is tested.
- Quiz scoring is tested.
- At least one end-to-end learner flow is covered.
- Tests are deterministic and do not depend on production data.

## Standard Loop — Phase 18

### 1. Discover Context

Inspect current testing libraries and scripts. Reuse existing test stack where practical.

### 2. Plan

Critical E2E candidate:
1. Admin logs in.
2. Creates/uses a course.
3. Adds lesson.
4. Enrolls student.
5. Student logs in.
6. Opens course.
7. Completes lesson.
8. Progress updates.
9. Student submits quiz if present.

### 3. Agent Execution

Add tests in layers rather than one giant brittle E2E suite.

### 4. Testing

Run isolated, module, integration, and E2E suites.

### 5. Bug-Fix / Testing Loop

Remove flaky assumptions and hidden test ordering.

### 6. Document Updating

Document test commands, fixtures, and CI expectations.

---

# Phase 19 — Performance, Pagination, Query Indexing, and Data Volume Readiness

## Objective

Make real datasets safe before production usage grows.

## Gate Criteria

- Large user/course/enrollment lists paginate.
- Search/filter queries use appropriate indexes where justified.
- Dashboard aggregations are measured.
- Obvious N+1 query patterns are removed.
- Large payloads are bounded.
- Frontend avoids unnecessary repeat fetching/rendering on core screens.

## Standard Loop — Phase 19

### 1. Discover Context

Measure representative API timings with seeded datasets.

### 2. Plan

Identify hot endpoints and expected data sizes.

### 3. Agent Execution

Add indexes based on actual query shapes, not guesses.

### 4. Testing

Record before/after timing for targeted endpoints.

### 5. Bug-Fix / Testing Loop

Check whether added indexes create expensive write overhead or duplicate existing indexes.

### 6. Document Updating

Document expected pagination defaults and performance assumptions.

---

# Phase 20 — Notifications, Email Delivery, and User Communication

## Objective

Turn password recovery and future academic notifications into reliable communication workflows.

## Gate Criteria

- Email provider configuration is environment-driven.
- Reset emails work without leaking tokens to logs.
- Email failures are handled predictably.
- Notification responsibilities are scoped.
- Templates are documented/testable.

## Standard Loop — Phase 20

### 1. Discover Context

Inspect any existing mail packages/configuration and current reset-password UI assumptions.

### 2. Plan

Start with transactional email only:
- password reset,
- account creation/invite if required.

Defer broad notifications unless product requirements justify them.

### 3. Agent Execution

Add mail service abstraction and templates.

### 4. Testing

Use safe test transport/provider sandbox where available.

### 5. Bug-Fix / Testing Loop

Never print live reset links/tokens to production logs.

### 6. Document Updating

Update env/setup and support troubleshooting docs.

---

# Phase 21 — Production Deployment, Backups, Monitoring, and Operational Readiness

## Objective

Move from MVP-capable software to deployable software with basic operational safety.

## Gate Criteria

- Production environment variables are documented.
- HTTPS/reverse proxy assumptions are documented.
- CORS is restricted appropriately.
- Cookies/tokens have production-safe flags.
- Database backup strategy exists and is tested/documented.
- Health endpoint is meaningful.
- Logs are centralized or deploy-platform accessible.
- Monitoring/alerting strategy exists.
- Production build/start commands are verified.
- Seed scripts cannot accidentally reset production data.

## Standard Loop — Phase 21

### 1. Discover Context

Inspect deployment artifacts if any, package scripts, env loader, CORS, trust proxy, cookie settings, MongoDB configuration, and health route.

### 2. Plan

Document the chosen hosting shape without assuming a provider unless already chosen.

### 3. Agent Execution

Harden runtime settings, deployment scripts/config, backups, and health checks.

### 4. Testing

Run a production-like deployment smoke test.

### 5. Bug-Fix / Testing Loop

Treat “works only in dev proxy mode” as a blocker.

### 6. Document Updating

Create production runbook and rollback checklist.

---

# Phase 22 — Security Hardening and Abuse Testing

## Objective

Perform a focused security pass after the application surface is substantially complete.

## Gate Criteria

- Authentication abuse paths are tested.
- Authorization bypass attempts are tested.
- NoSQL injection-style malformed inputs are handled safely.
- XSS-sensitive rendering paths are reviewed.
- File uploads are restricted.
- Rate limits exist on sensitive endpoints.
- Secrets are not exposed.
- Sensitive fields are excluded from API responses.
- Dependency vulnerabilities are reviewed with context rather than blindly upgraded.

## Standard Loop — Phase 22

### 1. Discover Context

Review all public and authenticated endpoints, upload surfaces, HTML rendering, query construction, and logging.

### 2. Plan

Build a threat checklist by surface:
- auth,
- user management,
- course authoring,
- enrollment,
- learner content,
- quiz,
- uploads,
- admin dashboard.

### 3. Agent Execution

Fix concrete findings only; do not cargo-cult security middleware.

### 4. Testing

Negative tests include:
- role escalation,
- ID tampering,
- malformed Mongo-like payloads,
- oversized payloads,
- repeated login/reset abuse,
- unauthorized file access.

### 5. Bug-Fix / Testing Loop

Critical and High findings block release.

### 6. Document Updating

Update security checklist and production runbook.

---

# Phase 23 — Final Evidence-Based Product Audit

## Objective

Re-audit the whole repository based on current code and runtime behavior, not on the original audit or this plan.

## Gate Criteria

- Every original audit item is classified as Fixed, Still Open, Re-scoped, or No Longer Applicable.
- Every core user flow is manually verified.
- Automated tests pass.
- Production-readiness checklist has no unexplained Critical/High gaps.
- Documentation matches behavior.
- Mock data is absent from production workflows unless intentionally retained and clearly labeled.

## Standard Loop — Phase 23

### 1. Discover Context

Re-scan the repository from scratch.

Do not trust earlier phase closure notes without checking code.

### 2. Plan

Create an audit matrix covering:
- architecture,
- auth,
- authorization,
- users,
- courses,
- lessons,
- enrollments,
- progress,
- quizzes,
- attendance,
- dashboards,
- uploads,
- API consistency,
- security,
- tests,
- deployment,
- docs.

### 3. Agent Execution

Do not make broad changes before the audit is written. Small evidence-gathering scripts/tests are acceptable.

### 4. Testing

Run full regression and manual critical flows.

### 5. Bug-Fix / Testing Loop

Create a final release-blocker list and resolve Critical/High items before release signoff.

### 6. Document Updating

Produce final:
- truth/current-state doc,
- production-readiness report,
- known limitations,
- release notes.

---

# Phase 24 — Release Candidate and Post-Release Safety Checklist

## Objective

Create a controlled release process so the first real deployment is not an improvised production experiment.

## Gate Criteria

- Release candidate version is identifiable.
- Database backup exists before deployment.
- Environment values are validated.
- Smoke-test checklist exists.
- Rollback path exists.
- Post-deploy health verification exists.
- Admin, ustad, coordinator, and student smoke tests exist.

## Standard Loop — Phase 24

### 1. Discover Context

Inspect exact deployment environment and current production runbook.

### 2. Plan

Prepare release checklist:
- backup,
- build,
- deploy,
- migrate/index if needed,
- smoke test,
- monitor,
- rollback trigger.

### 3. Agent Execution

Do not combine unrelated feature work into the release candidate.

### 4. Testing

Run pre-release regression and post-deploy smoke suite.

### 5. Bug-Fix / Testing Loop

Rollback if a release-blocking production defect is found and a safe forward fix is not immediately proven.

### 6. Document Updating

Write release notes and post-release known issues.

---

# Cross-Phase Dependency Map

Use this dependency order unless the current source proves a better sequence is necessary:

```text
Phase 1  Baseline
   ↓
Phase 2  Env / secrets hygiene
   ↓
Phase 3  Authentication lifecycle
   ↓
Phase 4  Authorization + role navigation
   ↓
Phase 5  Real user management
   ↓
Phase 6  Domain architecture
   ↓
Phase 7  Course CRUD
   ↓
Phase 8  Modules / lessons
   ↓
Phase 9  Enrollment
   ↓
Phase 10 Progress / learner UX
   ↓
Phase 11 Quiz MVP
   ↓
Phase 12 Attendance decision/implementation
   ↓
Phase 13 Real dashboards
   ↓
Phase 14 Upload security/resources
   ↓
Phase 15 API/error/validation consistency
   ↓
Phase 16 Frontend cleanup
   ↓
Phase 17 Accessibility/responsive UX
   ↓
Phase 18 Test expansion/E2E
   ↓
Phase 19 Performance/data-volume readiness
   ↓
Phase 20 Email/notifications
   ↓
Phase 21 Production operations
   ↓
Phase 22 Security hardening
   ↓
Phase 23 Final evidence-based audit
   ↓
Phase 24 Release candidate
```

Parallel work is allowed only when two phases do not touch the same contracts, models, or high-risk shared files.

---

# Required Gate Table

The agent must maintain a live table like this in the project docs:

| Phase | Gate Status | Evidence | Blocking Bugs | Deferred Items | Docs Updated |
|---|---|---|---|---|---|
| 1 | Not Started | — | — | — | — |
| 2 | Not Started | — | — | — | — |
| 3 | Not Started | — | — | — | — |
| 4 | Not Started | — | — | — | — |
| 5 | Not Started | — | — | — | — |
| 6 | Not Started | — | — | — | — |
| 7 | Not Started | — | — | — | — |
| 8 | Not Started | — | — | — | — |
| 9 | Not Started | — | — | — | — |
| 10 | Not Started | — | — | — | — |
| 11 | Not Started | — | — | — | — |
| 12 | Not Started | — | — | — | — |
| 13 | Not Started | — | — | — | — |
| 14 | Not Started | — | — | — | — |
| 15 | Not Started | — | — | — | — |
| 16 | Not Started | — | — | — | — |
| 17 | Not Started | — | — | — | — |
| 18 | Not Started | — | — | — | — |
| 19 | Not Started | — | — | — | — |
| 20 | Not Started | — | — | — | — |
| 21 | Not Started | — | — | — | — |
| 22 | Not Started | — | — | — | — |
| 23 | Not Started | — | — | — | — |
| 24 | Not Started | — | — | — | — |

Allowed statuses:
- Not Started
- Discovering
- Planned
- Implementing
- Testing
- Blocked
- Gate Passed
- Gate Failed

---

# Required Bug Log Format

Every bug discovered during execution should use this structure:

```md
## BUG-XXX — Short title

- Phase discovered:
- Severity: Critical / High / Medium / Low
- Status: Open / Fixed / Deferred
- Area:
- Reproduction:
- Expected:
- Actual:
- Root cause:
- Fix:
- Tests added/updated:
- Manual verification:
- Deferred-to phase (if any):
- Deferral reason (if any):
```

Do not use vague entries such as “API issue” or “UI bug.”

---

# Required Phase Closure Template

At the end of every phase, output this exact structure:

```md
# Phase X Closure

## Gate Result
PASS / FAIL

## What Changed
- ...

## Files Changed
- `path/to/file` — reason

## Tests Run
- command — result

## Manual Verification
- flow — result

## Security Checks
- ...

## Performance Observation
- ...

## Bugs Fixed
- BUG-...

## Deferred Items
- item — reason — owning phase

## Documentation Updated
- ...

## Regression Result
- Golden flows unchanged: YES / NO

## Ready for Next Phase?
YES / NO

## Next Phase
Phase X+1 — ...
```

---

# Required API Review Checklist

For every new or modified endpoint, verify:

- [ ] Correct HTTP method
- [ ] Stable route naming
- [ ] Authentication requirement defined
- [ ] Authorization requirement defined
- [ ] Zod/server validation
- [ ] Object ID/reference validation
- [ ] Correct status codes
- [ ] 404 behavior
- [ ] Conflict behavior where applicable
- [ ] Sensitive fields excluded
- [ ] Pagination for list endpoints where applicable
- [ ] Search/filter bounded
- [ ] Error shape consistent
- [ ] Automated success test
- [ ] Automated negative tests
- [ ] Manual API probe
- [ ] Frontend handles loading/error/empty state

---

# Required Security Review Checklist

Run this checklist during Phase 2, Phase 3, Phase 14, Phase 21, Phase 22, and final audit:

- [ ] `.env` files ignored
- [ ] no real secrets committed
- [ ] no fallback production JWT secret
- [ ] no password logging
- [ ] bcrypt hashing active
- [ ] password never returned by API
- [ ] reset tokens not logged
- [ ] refresh tokens revocable if used
- [ ] inactive users blocked
- [ ] role checks enforced server-side
- [ ] sensitive endpoints rate-limited
- [ ] Helmet/security headers enabled
- [ ] CORS restricted
- [ ] request payload size bounded
- [ ] file upload type/size validation
- [ ] no unsafe raw HTML rendering without review
- [ ] no client-supplied role escalation
- [ ] production stack traces hidden
- [ ] database URI not exposed
- [ ] API keys not exposed

---

# Required QA Regression Matrix

At minimum, maintain these scenarios as the product grows.

## Authentication

- Valid login
- Invalid email format
- Unknown email
- Wrong password
- Inactive account
- Expired token
- Missing token
- Malformed token
- Logout
- Refresh after logout
- Forgot password
- Expired reset token
- Reused reset token
- Change password

## Authorization

For each protected endpoint verify all roles:
- admin
- coordinator
- ustad
- student
- unauthenticated

## Users

- List users
- Search
- Filter role/status
- Pagination
- Create
- Duplicate email
- Edit
- Invalid role
- Activate/deactivate
- Authorization

## Courses

- Create
- Edit
- Publish
- Archive
- Invalid instructor
- Unauthorized edit
- List/search/filter

## Lessons

- Create module
- Create lesson
- Reorder
- Publish/unpublish
- Cross-course ID tampering
- Student unpublished access

## Enrollment

- First enrollment
- Duplicate enrollment
- Invalid course
- Invalid student
- Unauthorized enrollment
- Archived/inactive edge cases

## Progress

- Open enrolled lesson
- Open unenrolled lesson
- Complete lesson
- Duplicate completion
- Progress percent
- Resume learning

## Quiz

- Load quiz without answer keys
- Submit correct answers
- Submit wrong answers
- Empty submission
- Invalid option
- Attempt history
- Pass/fail

## UI

- Loading states
- Empty states
- Error states
- Unauthorized state
- Mobile layout
- Keyboard navigation
- Modal focus behavior

---

# Cursor / Agent Behavioral Prompt

Use the following instructions whenever an AI coding agent works on this plan:

> You are acting as a senior full-stack engineer, senior QA engineer, security reviewer, and pragmatic software architect on the Shine Al Furqan LMS.
>
> Do not optimize for the number of files changed. Optimize for correctness, evidence, and maintainability.
>
> Before editing, execute the phase’s Discover Context and Plan steps. Show the Current State Note, gate restatement, expected file-touch list, decisions/defaults, and test plan.
>
> Implement only the current phase unless a tiny prerequisite fix is necessary. If a prerequisite belongs to another phase, document why it is required.
>
> Do not remove existing working behavior without a regression test.
>
> Do not claim an issue is fixed until automated tests and manual verification demonstrate it.
>
> If code and documentation conflict, treat runtime code as the current truth, then fix the docs in the same phase.
>
> If you discover a security issue, do not print secrets. Report only the secret type, file, exposure mechanism, and remediation.
>
> Keep the repository runnable after each increment.
>
> At the end, output the Phase Closure template and stop. Do not automatically begin the next phase.

---

# Recommended First Command to Cursor

```text
Read the master implementation plan and execute Phase 1 only.

Follow the full Standard Loop exactly:
1. Discover Context
2. Plan
3. Agent Execution
4. Testing
5. Bug-Fix / Testing Loop
6. Document Updating

Do not start Phase 2.

Before editing any code, show me:
- the Phase 1 gate in your own words,
- the Current State Note,
- every file you expect to touch and its change classification,
- the golden regression flows you will establish,
- existing tests and commands you found,
- any assumptions/defaults.

Then execute Phase 1 in small runnable increments.

At the end, output the required Phase 1 Closure and stop.
```

---

# Recommended Command for Every Later Phase

```text
Execute Phase <N> from the Shine Al Furqan LMS master implementation plan.

First re-read the current repository and the previous phase closure. Do not trust stale assumptions from the original audit.

Follow the Standard Loop exactly:
1. Discover Context
2. Plan
3. Agent Execution
4. Testing
5. Bug-Fix / Testing Loop
6. Document Updating

Do not begin the next phase automatically.

Before code changes, show:
- current-state note,
- gate restatement,
- file-touch list,
- contract/schema impact,
- assumptions/defaults,
- automated test plan,
- manual verification plan.

After implementation, keep fixing/retesting until the gate is actually satisfied or explicitly mark the phase Gate Failed/Blocked.

Finish with the required Phase Closure template and stop.
```

---

# Final Program Principle

The goal is not to turn Shine Al Furqan into a giant enterprise platform as quickly as possible. The goal is to turn the existing demo shell into a **real, trustworthy LMS in controlled vertical slices**.

Every phase should leave the codebase:

- more real,
- more testable,
- more secure,
- better documented,
- less dependent on mocks,
- and no harder to understand than before.

If a change increases architectural complexity without creating clear product, security, testability, or maintenance value, reject it or defer it.

**Evidence beats assumptions. Working vertical slices beat placeholder breadth. Server-enforced rules beat UI illusions. Documentation must describe reality.**
