import { z } from 'zod';
import { USER_GENDERS, USER_ROLES } from '../models/User';
import { passwordPolicySchema } from './auth.validator';

export const managedRoleSchema = z.enum(USER_ROLES);
export const userGenderSchema = z.enum(USER_GENDERS);

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional().default(''),
  role: managedRoleSchema.optional(),
  isActive: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  gender: userGenderSchema.optional(),
  language: z.string().trim().min(1).max(40).optional(),
  batchId: z
    .string()
    .trim()
    .regex(/^[a-f\d]{24}$/i, 'Invalid batch id')
    .optional(),
  sort: z.enum(['name', 'email', 'created', 'role']).default('name'),
});

export const createUserSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  email: z.string().trim().email('Valid email is required'),
  password: passwordPolicySchema,
  role: managedRoleSchema,
  gender: userGenderSchema.optional(),
  languages: z.array(z.string().trim().min(1).max(40)).max(12).optional(),
  phone: z.string().trim().max(40).optional(),
  alternatePhone: z.string().trim().max(40).optional(),
  workLocation: z.string().trim().max(200).optional(),
});

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(120).optional(),
    email: z.string().trim().email('Valid email is required').optional(),
    password: passwordPolicySchema.optional(),
    gender: userGenderSchema.optional(),
    languages: z.array(z.string().trim().min(1).max(40)).max(12).optional(),
    phone: z.string().trim().max(40).optional(),
    alternatePhone: z.string().trim().max(40).optional(),
    workLocation: z.string().trim().max(200).optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.email !== undefined ||
      data.password !== undefined ||
      data.gender !== undefined ||
      data.languages !== undefined ||
      data.phone !== undefined ||
      data.alternatePhone !== undefined ||
      data.workLocation !== undefined,
    {
      message: 'At least one field is required',
    },
  );

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
