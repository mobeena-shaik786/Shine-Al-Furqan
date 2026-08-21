# Dashboard Metrics

Phase 13 definitions for live MongoDB aggregates. “Active” always means **role match + `isActive: true`** for users, or **`status: 'active'`** for enrollments/batches unless noted.

## Endpoints

| Role | Method | Path |
|------|--------|------|
| Admin | GET | `/api/admin/dashboard?month=YYYY-MM` |
| Coordinator | GET | `/api/coordinator/dashboard?month=YYYY-MM` |
| Ustad | GET | `/api/ustad/dashboard?month=YYYY-MM` |
| Student | GET | `/api/student/dashboard` |

`month` defaults to the current **UTC** calendar month (`YYYY-MM`).

## Admin / coordinator (academy-wide)

Coordinator payload is the same aggregates with `role: 'coordinator'`.

| Metric | Meaning | Source | Window / filter |
|--------|---------|--------|-----------------|
| `activeStudents` | Count of active student users | `User` | `role=student`, `isActive=true` |
| `activeUstads` | Count of active ustad users | `User` | `role=ustad`, `isActive=true` |
| `activeCoordinators` | Count of active coordinators | `User` | `role=coordinator`, `isActive=true` |
| `publishedCourses` | Published courses | `Course` | `status=published` |
| `activeBatches` | Batches in active delivery | `Batch` | `status=active` |
| `activeEnrollments` | Active enrollments | `Enrollment` | `status=active` |
| `quizAttemptsLast7Days` | Submitted quiz attempts | `QuizAttempt` | `submittedAt` ≥ now − 7d |
| `lessonsCompletedLast7Days` | Lesson completions | `LessonProgress` | `completedAt` ≥ now − 7d |
| Attendance `present` / `absent` / `late` / `excused` | Record counts | `AttendanceRecord` via sessions in month | Session `sessionDate` in UTC month |
| Attendance `rate` | Present ÷ total records × 100 (rounded) | Same | 0 if no records |
| Capacity `totalSeats` | Sum of batch `capacity` | `Batch` | `status` in `planned\|active` |
| Capacity `usedSeats` | Active enrollments on those batches | `Enrollment` | `status=active`, `batch` ∈ capacity batches |
| Capacity `availableSeats` | `max(0, total − used)` | Derived | |
| Capacity `utilizationPercent` | `round(used / total × 100)` | Derived | 0 if no seats |
| `recentEnrollments` | Latest enrollments (limit 8) | `Enrollment` + User/Course names | Sorted by `enrolledAt` desc |

## Ustad (scoped)

Scope = courses where `instructors` includes the ustad; batches where the ustad is an instructor **or** the batch’s course is in that set.

| Metric | Meaning |
|--------|---------|
| `assignedCourses` | Courses listing the ustad as instructor |
| `publishedAssignedCourses` | Subset with `status=published` |
| `assignedBatches` | Batches in scope |
| `assignedStudents` | Distinct students with active enrollment on assigned courses |
| `activeEnrollments` | Active enrollments on assigned courses |
| Attendance / capacity / recent / 7d activity | Same formulas as admin, filtered to assigned `course` ids |

Empty assignment → zeroed metrics and empty lists (no error).

## Student

| Metric | Meaning |
|--------|---------|
| `activeEnrollments` | Student’s enrollments with `status=active` |
| `averageProgressPercent` | Mean of per-course progress % (published lessons completed ÷ published lessons) |
| `quizAttemptsTotal` | All `QuizAttempt` rows for the student |
| `courses[]` | Enrolled courses with progress |
| `resumeCourse` | First course with progress &lt; 100%, else first enrollment |
| `recentAttendance` | Last 5 attendance marks (newest first) |

## Explicitly not on dashboards

| Surface | Reason |
|---------|--------|
| Lead pipeline | No Lead domain model |
| Fee overview | No Fee/invoice domain model |
| Header global search | Still mock (`mockDashboard.searchGlobal`) |

## Client

- Admin: `DashboardPage` → `GET /api/admin/dashboard`
- Coordinator / Ustad / Student pages → matching role endpoints
- Service: `client/src/services/dashboardApi.ts`
