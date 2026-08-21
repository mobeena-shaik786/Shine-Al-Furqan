# Release Notes — 1.0.0-rc.1

First release candidate of Shine Al Furqan LMS (React + Express + MongoDB).

## Highlights

- Real authentication lifecycle (access JWT + HttpOnly refresh, password reset via email)
- Role-based admin, coordinator, ustad, and student experiences
- Courses, modules, lessons, enrollments, progress, quizzes, attendance
- Role dashboards with live aggregates
- Secure lesson file uploads/downloads (local disk provider)
- Production ops docs: deploy, backup, monitoring, runbook
- Security hardening: rate limits, scoped ustad data access, abuse tests

## Operator requirements

- HTTPS reverse proxy, `COOKIE_SECURE=true`, SMTP mail, Mongo backups
- Follow `docs/RELEASE_CHECKLIST.md` and `docs/SMOKE_TESTS.md`

## Known issues

See `docs/KNOWN_LIMITATIONS.md`.

## Upgrade / install

See `docs/DEPLOY.md`. No automated DB migration runner — indexes are created by Mongoose models on boot.
