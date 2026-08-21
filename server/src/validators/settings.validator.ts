import { z } from 'zod';
import { NOTIFICATION_AUDIENCES, NOTIFICATION_TYPES } from '../models/Notification';

export const updateSettingsSchema = z
  .object({
    salary: z
      .object({
        basePay: z.number().min(0).max(1_000_000).optional(),
        incentiveRate: z.number().min(0).max(100_000).optional(),
        defaultMode: z.enum(['unique', 'fixed']).optional(),
      })
      .optional(),
    liveClass: z
      .object({
        enabled: z.boolean().optional(),
        jitsiDomain: z.string().trim().min(1).max(200).optional(),
        roomPrefix: z
          .string()
          .trim()
          .min(1)
          .max(80)
          .regex(/^[a-zA-Z0-9-]+$/, 'Room prefix may only contain letters, numbers, and hyphens')
          .optional(),
      })
      .optional(),
  })
  .refine((data) => Boolean(data.salary || data.liveClass), 'At least one settings section is required');

export const sendNotificationSchema = z.object({
  audience: z.enum(NOTIFICATION_AUDIENCES),
  type: z.enum(NOTIFICATION_TYPES).default('info'),
  subject: z.string().trim().min(1, 'Subject is required').max(200),
  message: z.string().trim().min(1, 'Message is required').max(5000),
});

export const listNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type SendNotificationInput = z.infer<typeof sendNotificationSchema>;
export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;
