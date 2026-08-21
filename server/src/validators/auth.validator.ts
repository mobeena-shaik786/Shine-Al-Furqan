import { z } from 'zod';

/** Shared password policy for create / change / reset (not used to gate login length). */
export const passwordPolicySchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Za-z]/, 'Password must include a letter')
  .regex(/[0-9]/, 'Password must include a number');

export const loginSchema = z.object({
  email: z
    .string()
    .transform((v) => v.trim().toLowerCase())
    .pipe(z.string().email('Valid email is required')),
  password: z
    .string()
    .transform((v) => v.replace(/[\r\n]+/g, '').trim())
    .pipe(z.string().min(1, 'Password is required')),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Valid email is required'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordPolicySchema,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordPolicySchema,
});

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(120).optional(),
    phone: z.string().trim().max(40).optional(),
    alternatePhone: z.string().trim().max(40).optional(),
    workLocation: z.string().trim().max(200).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, 'At least one field is required');

export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
