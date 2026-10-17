import { z } from 'zod';
import {
  ACHIEVEMENT_KEYS,
  ACTIVITY_TYPES,
  ATTEMPT_KINDS,
  ATTEMPT_STATUSES,
  CONTENT_STATUSES,
  DIFFICULTIES,
  HARNESS_CODECS,
  HARNESS_ORDERINGS,
  LESSON_KINDS,
  LOCALES,
  PLAN_STATES,
  PLAN_TASK_KINDS,
  PRACTICE_LANGUAGES,
  PROBLEM_DIFFICULTIES,
  PROBLEM_STATUSES,
  PROGRESS_STATUSES,
  PROJECT_STATUSES,
  SEARCH_ENTITY_TYPES,
  THEMES,
  TRACK_SLUGS,
} from '../constants';
import { isValidTimeZone } from '../dates';

export const trackSlugSchema = z.enum(TRACK_SLUGS);
export const localeSchema = z.enum(LOCALES);
export const themeSchema = z.enum(THEMES);
export const difficultySchema = z.enum(DIFFICULTIES);
export const contentStatusSchema = z.enum(CONTENT_STATUSES);
export const lessonKindSchema = z.enum(LESSON_KINDS);
export const progressStatusSchema = z.enum(PROGRESS_STATUSES);
export const planTaskKindSchema = z.enum(PLAN_TASK_KINDS);
export const planStateSchema = z.enum(PLAN_STATES);
export const activityTypeSchema = z.enum(ACTIVITY_TYPES);
export const achievementKeySchema = z.enum(ACHIEVEMENT_KEYS);
export const searchEntityTypeSchema = z.enum(SEARCH_ENTITY_TYPES);
export const projectStatusSchema = z.enum(PROJECT_STATUSES);
export const problemDifficultySchema = z.enum(PROBLEM_DIFFICULTIES);
export const problemStatusSchema = z.enum(PROBLEM_STATUSES);
export const practiceLanguageSchema = z.enum(PRACTICE_LANGUAGES);
export const attemptKindSchema = z.enum(ATTEMPT_KINDS);
export const attemptStatusSchema = z.enum(ATTEMPT_STATUSES);
export const harnessCodecSchema = z.enum(HARNESS_CODECS);
export const harnessOrderingSchema = z.enum(HARNESS_ORDERINGS);

export const localDateSchema = z.iso.date();
export const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Expected YYYY-MM');
export const timestampSchema = z.iso.datetime({ offset: true });
export const slugSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Expected a lowercase slug');
export const timeZoneSchema = z
  .string()
  .min(1)
  .max(64)
  .refine(isValidTimeZone, 'Unknown IANA time zone');

export const idParamsSchema = z.object({ id: z.coerce.number().int().positive() });
export const slugParamsSchema = z.object({ slug: slugSchema });

export const trackMinutesSchema = z.record(trackSlugSchema, z.number().int().nonnegative());

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
    requestId: z.string().optional(),
  }),
});
export type ApiErrorBody = z.infer<typeof apiErrorSchema>;
