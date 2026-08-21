# Performance & Pagination (Phase 19)

## Defaults

| List | Default `limit` | Max `limit` | Notes |
|------|-----------------|-------------|-------|
| Users | 10 | 100 | Search/filter + stats meta |
| Courses | 20 | 100 | UI pages at 12 |
| Batches | 50 | 100 | Optional `courseId`, `status`, `search` |
| Enrollments | 50 | 100 | Filter by student/course/batch/status |
| Attendance sessions | 50 | 100 | Filter by batch/course |
| My attendance | 50 | 100 | Student history |

Response shape: `data` = page rows, `meta` = `{ page, limit, total, totalPages }`.

Curriculum trees (modules/lessons per course) stay unpaginated — bounded by course authoring size.

## Indexes added / reinforced

- `Enrollment`: `{ batch, status }`, `{ student, status }`
- `AttendanceRecord`: `{ student, createdAt: -1 }`
- `AttendanceSession`: `{ sessionDate, course }` (month dashboard filters)

## N+1 removals

- Student course list / dashboard progress: `getCourseProgressBatch` (2 queries for N courses)
- Attendance mark upsert: one enrollment `$in` lookup instead of per-student finds
- Dashboard monthly attendance: `$group` aggregation by status

## Assumptions

- Demo volumes: hundreds of users/courses, thousands of enrollments/attendance rows.
- Dashboard month scan is acceptable for academy-scale sessions; revisit with materialized monthly counters if needed.
- Production should monitor slow query logs after seeding realistic volume.
