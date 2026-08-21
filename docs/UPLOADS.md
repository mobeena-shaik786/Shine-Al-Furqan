# File Uploads & Learning Resources (Phase 14)

## Strategy

| Environment | Storage | Notes |
|-------------|---------|-------|
| Development / demo / single-node | **Local disk** (`UPLOAD_ROOT`, default `./uploads`) | Blobs never served as public static files |
| Production (multi-node / durable) | **Object storage** (S3-compatible) | Swap `StorageProvider`; keep the same keys + `LearningResource` metadata |

Local disk is **not** production-appropriate for multi-instance or durable HA. Production must use object storage (or a shared volume with the same provider interface) and private buckets with signed/auth downloads.

Env (see `server/.env.example`):

- `UPLOAD_ROOT` — local directory (gitignored)
- `UPLOAD_MAX_BYTES` — DEFAULT `10485760` (10 MiB)

## Allowed types (explicit)

| MIME | Extension used on disk |
|------|------------------------|
| `application/pdf` | `.pdf` |
| `image/jpeg` | `.jpg` |
| `image/png` | `.png` |
| `image/webp` | `.webp` |
| `image/gif` | `.gif` |
| `audio/mpeg` | `.mp3` |
| `audio/wav` | `.wav` |
| `audio/webm` | `.weba` |
| `video/mp4` | `.mp4` |
| `video/webm` | `.webm` |

Anything else (executables, HTML, scripts, zip, etc.) is rejected. Content is checked with **magic bytes**; declared MIME alone is not trusted.

## Filename & path safety

- Display name: `path.basename` only, stripped of `<>:"|?*\/` and nulls (max 200 chars).
- Storage key: `randomUUID() + allowlisted extension` — **never** derived from user path segments.
- Provider resolves keys under `UPLOAD_ROOT` and blocks `..` / absolute escapes.

## Authorization

| Action | Who |
|--------|-----|
| Upload / delete | Course managers (`admin`, `coordinator`, assigned `ustad`) |
| List / download | Anyone who can view the course (managers, published+enrolled students, published ustads) |

Downloads require Bearer auth. Files are streamed as `Content-Disposition: attachment` with `X-Content-Type-Options: nosniff`. Upload routes have a tighter rate limit (40 / 15 min).

## Metadata

Model: `LearningResource` — course, lesson, originalFilename, storedKey, mimeType, sizeBytes, uploadedBy, status (`active` \| `deleted`), deletedAt.

## Deletion

1. Mark `status=deleted` + `deletedAt`.
2. Delete blob from storage immediately.
3. Subsequent downloads return **404**.

## APIs

| Method | Path |
|--------|------|
| POST | `/api/lessons/:lessonId/resources` (multipart field `file`) |
| GET | `/api/lessons/:lessonId/resources` |
| GET | `/api/resources/:id` |
| GET | `/api/resources/:id/download` |
| DELETE | `/api/resources/:id` |

## Client

Lesson detail (`CourseDetailPage`) → `LessonResourcesPanel` for non-quiz lessons.
