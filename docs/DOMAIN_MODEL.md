# Domain Model — Academic Architecture (Phase 6)

> DEFAULT field set until product/spec overrides. No public HTTP CRUD yet — that starts in Phase 7+.

## Decision: Batch is included

Shine Al Furqan navigation and academy terminology use **batches** (cohorts) alongside courses. Batch is a first-class entity, not excluded.

## Entity relationship

```text
User (admin/coordinator)
   │ createdBy
   ▼
Course ──instructors──► User (ustad)
   │
   ├──< CourseModule (order unique per course)
   │         │
   │         └──< Lesson (order unique per module; also refs course)
   │
   └──< Batch ──instructors──► User (ustad)
            (name unique per course)
```

Enrollment / batch membership is **Phase 9** (not modeled here).

## Subject nav item

`/subjects` remains Coming Soon. Courses use a string `category` for grouping (DEFAULT). A dedicated Subject collection is deferred unless product requires it.

## Field glossary

### Course (`courses`)

| Field | Type | Notes |
|-------|------|-------|
| title | string | Required |
| code | string | Unique, normalized uppercase slug-like code |
| description | string | DEFAULT empty |
| category | string | DEFAULT `general` (subject-like label) |
| thumbnailUrl | string? | Optional http(s) URL |
| status | `draft` \| `published` \| `archived` | DEFAULT `draft` |
| instructors | ObjectId[] → User | Must be active `ustad` |
| createdBy | ObjectId → User | Required |

**Indexes:** unique `code`; `{ status, category }`; `instructors`; `createdBy`

### CourseModule (`coursemodules`)

| Field | Type | Notes |
|-------|------|-------|
| course | ObjectId → Course | Required |
| title | string | Required |
| order | number ≥ 1 | Unique per course |

**Indexes:** unique `{ course, order }`

### Lesson (`lessons`)

| Field | Type | Notes |
|-------|------|-------|
| course | ObjectId → Course | Required (denormalized for course-scoped queries) |
| module | ObjectId → CourseModule | Must belong to `course` |
| title | string | Required |
| lessonType | `text` \| `video` \| `pdf` \| `quiz` \| `live` \| `other` | DEFAULT `text` |
| content | string | Body / markdown (DEFAULT empty) |
| resourceUrl | string? | Optional external http(s) URL |
| order | number ≥ 1 | Unique per module |
| durationMinutes | number? | Optional |
| status | `draft` \| `published` | DEFAULT `draft` |

**Indexes:** unique `{ module, order }`; `{ course, order }`; `status`

### LearningResource (`learningresources`) — Phase 14

| Field | Type | Notes |
|-------|------|-------|
| course / lesson | ObjectId | Required |
| originalFilename | string | Display only (sanitized basename) |
| storedKey | string | UUID + allowlisted extension (unique) |
| mimeType / sizeBytes | string / number | Verified allowlist |
| uploadedBy | ObjectId → User | |
| status | `active` \| `deleted` | Soft-delete; blob removed on delete |

See `docs/UPLOADS.md`.

### Batch (`batches`)

| Field | Type | Notes |
|-------|------|-------|
| name | string | Unique per course |
| course | ObjectId → Course | Required |
| instructors | ObjectId[] → User | Active `ustad` only |
| capacity | number 1–500 | DEFAULT 30 |
| startDate / endDate | Date? | end ≥ start when both set |
| scheduleNote | string | DEFAULT free text until timetable model |
| status | `planned` \| `active` \| `completed` \| `cancelled` | DEFAULT `planned` |
| createdBy | ObjectId → User | Required |

**Indexes:** unique `{ name, course }`; `{ course, status }`; `instructors`

## Ownership rules

1. Course instructors and batch instructors must reference **active users with role `ustad`**.
2. Lesson `module` must belong to the same `course` as `lesson.course`.
3. Duplicate course `code`, module `order` (per course), lesson `order` (per module), and batch `name` (per course) are rejected (`409`).
4. `createdBy` records who created the course/batch (admin/coordinator expected at API layer in Phase 7).

## Service entry points (no HTTP yet)

`server/src/services/academic.service.ts`:

- `createCourse`, `createModule`, `createLesson`, `createBatch`
- `assertUstadInstructors`
- DTO helpers: `toCourseDto`, `toModuleDto`, `toLessonDto`, `toBatchDto`

Validators: `server/src/validators/academic.validator.ts`

## Explicitly not in Phase 6

- REST routes / course UI (Phases 7–10 — **now complete**, see `PHASE_7_10_CLOSURE.md`)
- Dedicated Subject collection
- Quiz answer keys (Phase 11)

## Added in Phases 7–10

### Enrollment (`enrollments`)
- Unique `{ student, course }`; status `active|completed|dropped|pending`
- Optional `batch`; `createdBy`

### LessonProgress (`lessonprogresses`)
- Unique `{ student, lesson }`; `completedAt?`, `lastAccessedAt`
- Progress % = completed published lessons / total published lessons
