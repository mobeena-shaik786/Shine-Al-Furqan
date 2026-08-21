import { z } from 'zod';

export const SALARY_BASE_PAY = 2000;
export const SALARY_INCENTIVE_RATE = 150;

export const salaryModes = ['unique', 'fixed'] as const;
export type SalaryMode = (typeof salaryModes)[number];

export const listSalariesQuerySchema = z.object({
  year: z.coerce.number().int().min(2020).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  mode: z.enum(salaryModes).default('unique'),
  search: z.string().trim().max(200).optional(),
});

export const salaryDetailQuerySchema = z.object({
  year: z.coerce.number().int().min(2020).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  mode: z.enum(salaryModes).default('unique'),
});

export type ListSalariesQuery = z.infer<typeof listSalariesQuerySchema>;
export type SalaryDetailQuery = z.infer<typeof salaryDetailQuerySchema>;
