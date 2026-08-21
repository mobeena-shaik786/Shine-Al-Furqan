import { z } from 'zod';
import {
  BATCH_STATUSES,
  COURSE_STATUSES,
  LESSON_STATUSES,
  LESSON_TYPES,
} from '../models/academic/constants';
import { ENROLLMENT_STATUSES } from '../models/academic/Enrollment';

const objectIdString = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, 'Valid id is required');

export const createCourseSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  code: z.string().trim().max(64).optional(),
  description: z.string().trim().max(5000).optional().default(''),
  category: z.string().trim().max(120).optional().default('general'),
  thumbnailUrl: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined))
    .refine((v) => v === undefined || /^https?:\/\//i.test(v), {
      message: 'thumbnailUrl must be an http(s) URL',
    }),
  status: z.enum(COURSE_STATUSES).optional().default('draft'),
  instructorIds: z.array(objectIdString).optional().default([]),
  topicIds: z.array(objectIdString).optional().default([]),
});

export const createModuleSchema = z.object({
  courseId: objectIdString,
  title: z.string().trim().min(1, 'Title is required').max(200),
  order: z.number().int().min(1),
});

export const createLessonSchema = z.object({
  courseId: objectIdString,
  moduleId: objectIdString,
  title: z.string().trim().min(1, 'Title is required').max(200),
  lessonType: z.enum(LESSON_TYPES).optional().default('text'),
  content: z.string().max(100_000).optional().default(''),
  resourceUrl: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined))
    .refine((v) => v === undefined || /^https?:\/\//i.test(v), {
      message: 'resourceUrl must be an http(s) URL',
    }),
  order: z.number().int().min(1),
  durationMinutes: z.number().int().min(0).max(24 * 60).optional(),
  status: z.enum(LESSON_STATUSES).optional().default('draft'),
});

export const createBatchSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(200),
    courseId: objectIdString,
    instructorIds: z.array(objectIdString).optional().default([]),
    coordinatorId: objectIdString.optional(),
    capacity: z.number().int().min(1).max(500).optional().default(30),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    scheduleNote: z.string().trim().max(1000).optional().default(''),
    scheduleSlots: z
      .array(
        z.object({
          day: z.enum([
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
            'Sunday',
          ]),
          startTime: z
            .string()
            .trim()
            .regex(/^\d{2}:\d{2}$/, 'Use HH:MM'),
          endTime: z
            .string()
            .trim()
            .regex(/^\d{2}:\d{2}$/, 'Use HH:MM'),
        }),
      )
      .optional()
      .default([]),
    status: z.enum(BATCH_STATUSES).optional().default('active'),
  })
  .refine(
    (data) =>
      !data.startDate || !data.endDate || data.endDate.getTime() >= data.startDate.getTime(),
    { message: 'endDate must be on or after startDate', path: ['endDate'] },
  );

export const listCoursesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(200).optional(),
  category: z.string().trim().max(120).optional(),
  status: z.enum(COURSE_STATUSES).optional(),
  /** UI filter: active = published, inactive = draft|archived */
  activity: z.enum(['active', 'inactive']).optional(),
  sort: z.enum(['title', '-title', 'createdAt', '-createdAt']).default('-createdAt'),
});

export const updateCourseSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().min(1).max(5000).optional(),
    category: z.string().trim().max(120).optional(),
    thumbnailUrl: z
      .string()
      .trim()
      .max(500)
      .optional()
      .transform((v) => (v && v.length > 0 ? v : undefined))
      .refine((v) => v === undefined || /^https?:\/\//i.test(v), {
        message: 'thumbnailUrl must be an http(s) URL',
      }),
    instructorIds: z.array(objectIdString).optional(),
    topicIds: z.array(objectIdString).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, 'At least one field is required');
export const updateCourseStatusSchema = z.object({ status: z.enum(COURSE_STATUSES) });
export const updateModuleSchema = z
  .object({ title: z.string().trim().min(1).max(200).optional(), order: z.number().int().min(1).optional() })
  .refine((data) => Object.keys(data).length > 0, 'At least one field is required');
export const updateLessonSchema = createLessonSchema
  .omit({ courseId: true, moduleId: true })
  .partial()
  .refine((data) => Object.keys(data).length > 0, 'At least one field is required');
export const updateBatchSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    instructorIds: z.array(objectIdString).optional(),
    coordinatorId: objectIdString.nullable().optional(),
    capacity: z.number().int().min(1).max(500).optional(),
    startDate: z.coerce.date().optional().nullable(),
    endDate: z.coerce.date().optional().nullable(),
    scheduleNote: z.string().trim().max(1000).optional(),
    scheduleSlots: z
      .array(
        z.object({
          day: z.enum([
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
            'Sunday',
          ]),
          startTime: z
            .string()
            .trim()
            .regex(/^\d{2}:\d{2}$/, 'Use HH:MM'),
          endTime: z
            .string()
            .trim()
            .regex(/^\d{2}:\d{2}$/, 'Use HH:MM'),
        }),
      )
      .optional(),
    status: z.enum(BATCH_STATUSES).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, 'At least one field is required');
export const createEnrollmentSchema = z.object({
  studentId: objectIdString,
  courseId: objectIdString,
  batchId: objectIdString.optional(),
});
export const listEnrollmentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  studentId: objectIdString.optional(),
  courseId: objectIdString.optional(),
  batchId: objectIdString.optional(),
  status: z.enum(ENROLLMENT_STATUSES).optional(),
});

export const listBatchesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  courseId: objectIdString.optional(),
  status: z.enum(BATCH_STATUSES).optional(),
  /** UI bucket: inactive = planned|cancelled */
  activity: z.enum(['active', 'inactive', 'completed']).optional(),
  search: z.string().trim().max(200).optional(),
  sort: z.enum(['-createdAt', 'createdAt', 'name', '-name']).default('-createdAt'),
});

export const updateEnrollmentStatusSchema = z.object({
  status: z.enum(['completed', 'dropped']),
});
export const updateProgressSchema = z.object({ completed: z.boolean().optional().default(false) });

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type CreateModuleInput = z.infer<typeof createModuleSchema>;
export type CreateLessonInput = z.infer<typeof createLessonSchema>;
export type CreateBatchInput = z.infer<typeof createBatchSchema>;
export type ListCoursesQuery = z.infer<typeof listCoursesQuerySchema>;
export type ListBatchesQuery = z.infer<typeof listBatchesQuerySchema>;
export type ListEnrollmentsQuery = z.infer<typeof listEnrollmentsQuerySchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type UpdateModuleInput = z.infer<typeof updateModuleSchema>;
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;
export type UpdateBatchInput = z.infer<typeof updateBatchSchema>;
export type CreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>;
