/** Shared academic domain enums (DEFAULT until product specifies otherwise). */

export const COURSE_STATUSES = ['draft', 'published', 'archived'] as const;
export type CourseStatus = (typeof COURSE_STATUSES)[number];

export const LESSON_TYPES = ['text', 'video', 'pdf', 'quiz', 'live', 'other'] as const;
export type LessonType = (typeof LESSON_TYPES)[number];

export const LESSON_STATUSES = ['draft', 'published'] as const;
export type LessonStatus = (typeof LESSON_STATUSES)[number];

export const BATCH_STATUSES = ['planned', 'active', 'completed', 'cancelled'] as const;
export type BatchStatus = (typeof BATCH_STATUSES)[number];

/** Normalize a human title/code into a stable unique course code. */
export function normalizeCourseCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}
