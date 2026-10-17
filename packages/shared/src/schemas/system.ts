import { z } from 'zod';
import { timestampSchema } from './common';

export const healthSchema = z.object({
  status: z.enum(['ok', 'degraded']),
  version: z.string(),
  environment: z.string(),
  time: timestampSchema,
  uptimeSeconds: z.number().nonnegative(),
  database: z.object({
    status: z.enum(['ok', 'error']),
    appliedMigrations: z.number().int().nonnegative(),
  }),
  content: z.object({
    tracks: z.number().int().nonnegative(),
    courses: z.number().int().nonnegative(),
    lessons: z.number().int().nonnegative(),
    lessonsWithContent: z.number().int().nonnegative(),
  }),
  ai: z.object({
    provider: z.enum(['none', 'ollama']),
    status: z.enum(['not_configured', 'unreachable', 'ready']),
    message: z.string(),
  }),
});
export type Health = z.infer<typeof healthSchema>;
