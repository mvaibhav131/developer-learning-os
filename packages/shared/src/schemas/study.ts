import { z } from 'zod';
import { MAX_SESSION_MINUTES } from '../constants';
import { localDateSchema, slugSchema, timestampSchema, trackSlugSchema } from './common';

export const studySessionSourceSchema = z.enum(['timer', 'manual']);

export const createStudySessionSchema = z.strictObject({
  trackSlug: trackSlugSchema,
  durationMinutes: z.number().int().min(1).max(MAX_SESSION_MINUTES),
  studiedOn: localDateSchema.optional(),
  note: z.string().trim().max(500).optional(),
  planTaskId: z.number().int().positive().optional(),
  lessonSlug: slugSchema.optional(),
  completePlanTask: z.boolean().optional(),
  source: studySessionSourceSchema.default('manual'),
});
export type CreateStudySession = z.input<typeof createStudySessionSchema>;

export const studySessionSchema = z.object({
  id: z.number().int(),
  trackSlug: trackSlugSchema,
  durationMinutes: z.number().int(),
  startedAt: timestampSchema,
  localDate: localDateSchema,
  source: studySessionSourceSchema,
  note: z.string().nullable(),
  planTaskId: z.number().int().nullable(),
  lessonSlug: slugSchema.nullable(),
});
export type StudySession = z.infer<typeof studySessionSchema>;

export const listStudySessionsQuerySchema = z.object({
  from: localDateSchema.optional(),
  to: localDateSchema.optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});
export const listStudySessionsResponseSchema = z.object({
  sessions: z.array(studySessionSchema),
});
