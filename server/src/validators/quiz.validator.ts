import { z } from 'zod';

const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Valid id is required');
const option = z.object({ optionId: z.string().trim().min(1).max(100), text: z.string().trim().min(1).max(2000) });
const questionFields = z.object({
  prompt: z.string().trim().min(1).max(5000),
  options: z.array(option).min(2).refine((items) => new Set(items.map((item) => item.optionId)).size === items.length, 'Option ids must be unique'),
  correctOptionId: z.string().trim().min(1).max(100),
  order: z.number().int().min(1),
});
const question = questionFields.refine((data) => data.options.some((option) => option.optionId === data.correctOptionId), { path: ['correctOptionId'], message: 'correctOptionId must match an option' });

export const createQuizSchema = z.object({ lessonId: objectId, title: z.string().trim().min(1).max(200).optional(), passThresholdPercent: z.number().min(0).max(100).optional(), maxAttempts: z.number().int().min(0).optional() });
export const quizQuestionSchema = question;
export const updateQuizQuestionSchema = questionFields.partial().refine((value) => Object.keys(value).length > 0, 'At least one field is required');
export const submitAttemptSchema = z.object({ answers: z.array(z.object({ questionId: objectId, optionId: z.string().trim().min(1).max(100) })).min(1) });
export type CreateQuizInput = z.infer<typeof createQuizSchema>;
export type QuizQuestionInput = z.infer<typeof quizQuestionSchema>;
export type UpdateQuizQuestionInput = z.infer<typeof updateQuizQuestionSchema>;
