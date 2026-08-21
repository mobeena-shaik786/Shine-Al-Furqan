# Phases 7–10 Closure Note

**Phases:**  
7 Course CRUD · 8 Module/Lesson authoring · 9 Enrollment/Batches · 10 Student progress  

**Status:** Complete

## Gate summary

| Phase | Criterion | Met |
|-------|-----------|-----|
| 7 | Real course list/create/edit/archive + instructor assign | Yes |
| 7 | Draft/published enforced; unauthorized cannot mutate | Yes |
| 7 | Course UI not Coming Soon | Yes (`CoursesPage`, `CourseDetailPage`) |
| 8 | Module/lesson CRUD, order, publish | Yes |
| 8 | Students cannot see unpublished lessons | Yes |
| 9 | Enrollment persists; unique student+course | Yes |
| 9 | Students only see enrolled courses | Yes |
| 9 | Admin/coordinator enrollment UI | Yes (course detail) |
| 10 | Student dashboard lists enrolled + progress | Yes |
| 10 | Lesson complete + percent formula | Yes |

## Progress formula

`percent = totalPublishedLessons === 0 ? 0 : round(completedPublished / totalPublished * 100)`

Only **published** lessons count. Active enrollment required.

## Key APIs

- `/api/courses`, `/api/courses/:id`, `/api/courses/:id/status`
- `/api/courses/:courseId/modules`, `/api/modules/:id`, `/api/modules/:moduleId/lessons`
- `/api/lessons/:id`, `/api/lessons/:id/progress`
- `/api/courses/:id/progress`
- `/api/enrollments`, `/api/enrollments/me`
- `/api/batches`

(Also mounted under `/api/v1/...`)

## UI surfaces

| Path | Audience |
|------|----------|
| `/courses` | All roles (students = enrolled only) |
| `/courses/:id` | Curriculum + learn / author |
| `/batches` | Staff (create: admin/coordinator) |
| `/student/dashboard` | Enrolled courses + resume CTA |

## Tests

- Server: `academic.api.golden.test.ts` + prior suites (**27** total)
- Client typecheck + unit tests green

## Deferred

- Batch detail roster UI
- Subject collection
- Quiz (Phase 11)
- File uploads (Phase 14)
- Attendance (Phase 12)
