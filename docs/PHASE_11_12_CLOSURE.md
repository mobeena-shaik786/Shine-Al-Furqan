# Phases 11–12 Closure Note

**Phases:** 11 Quiz MVP · 12 Attendance (Path A — implemented)  
**Status:** Complete

## Phase 11 — Quiz

| Criterion | Met |
|-----------|-----|
| Staff create quiz questions | Yes |
| Student GET omits `correctOptionId` | Yes |
| Submit answers; server scores | Yes |
| Attempt history persists | Yes |
| Pass/fail rule | `percent >= passThresholdPercent` (DEFAULT 70) |
| Client cannot alter score | Yes (server-only) |

### Defaults
- Question type: single-answer MCQ
- `maxAttempts`: `0` = unlimited
- One quiz per lesson (unique lesson index)

### APIs
- `POST/GET /api/lessons/:lessonId/quiz`
- `POST /api/quizzes/:id/questions`
- `PATCH/DELETE /api/questions/:id`
- `POST/GET /api/quizzes/:id/attempts`

### UI
- Course detail: quiz lessons use `QuizPanel` (author + take quiz)

## Phase 12 — Attendance (Path A)

Chosen **implement** (not defer): navigation and academy roles already center on attendance.

| Criterion | Met |
|-----------|-----|
| Sessions linked to batch + date | Yes |
| Ustad/coordinator/admin can record | Yes |
| Student can read own history | Yes (`/attendance/me`) |
| Duplicate session prevented | Yes (unique batch+date → 409) |

### APIs
- `POST/GET /api/attendance/sessions`
- `GET /api/attendance/sessions/:id`
- `PUT /api/attendance/sessions/:id/records`
- `GET /api/attendance/me`

### UI
- `/attendance` — staff mark UI; student history list

## Tests
- `tests/quiz.attendance.golden.test.ts` (2)
- Full server suite green after Phases 11–12

## Deferred
- Rich quiz types beyond MCQ
- Timed quizzes / shuffle
- Attendance timezone preferences beyond UTC calendar date
- Phase 13 real dashboards
