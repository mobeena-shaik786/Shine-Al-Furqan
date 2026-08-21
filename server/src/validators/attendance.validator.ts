import { z } from 'zod';
import { ATTENDANCE_STATUSES } from '../models/academic';

const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Valid id is required');
export const createSessionSchema = z.object({
  batchId: objectId,
  sessionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'sessionDate must be YYYY-MM-DD'),
  note: z.string().trim().max(1000).optional(),
});
export const listSessionsSchema = z.object({
  batchId: objectId.optional(),
  courseId: objectId.optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export const overviewQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  batchId: objectId.optional(),
});
export const listMyAttendanceSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export const upsertRecordsSchema = z.object({
  records: z.array(z.object({ studentId: objectId, status: z.enum(ATTENDANCE_STATUSES) })).min(1),
});
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type ListSessionsQuery = z.infer<typeof listSessionsSchema>;
export type OverviewQuery = z.infer<typeof overviewQuerySchema>;
export type ListMyAttendanceQuery = z.infer<typeof listMyAttendanceSchema>;
