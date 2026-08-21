import { z } from 'zod';
import { LEAD_GENDERS, LEAD_SOURCES, LEAD_STATUSES } from '../models/Lead';

const objectIdString = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const createLeadSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
  phone: z.string().trim().min(7, 'Phone is required').max(32),
  email: z.string().trim().email().max(200).optional().or(z.literal('')),
  gender: z.enum(LEAD_GENDERS).optional(),
  source: z.enum(LEAD_SOURCES).default('whatsapp'),
  status: z.enum(LEAD_STATUSES).default('new'),
  language: z.string().trim().max(50).optional().or(z.literal('')),
  assignment: z.string().trim().max(120).optional().or(z.literal('')),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
});

export const updateLeadSchema = createLeadSchema.partial();

export const listLeadsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(200).optional(),
  status: z.enum(LEAD_STATUSES).optional(),
  gender: z.enum(LEAD_GENDERS).optional(),
  source: z.enum(LEAD_SOURCES).optional(),
  language: z.string().trim().max(50).optional(),
  assignment: z.string().trim().max(120).optional(),
  from: z.string().trim().optional(),
  to: z.string().trim().optional(),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type ListLeadsQuery = z.infer<typeof listLeadsQuerySchema>;

export { objectIdString };
