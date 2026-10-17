import { z } from 'zod';
import { localeSchema, themeSchema, timeZoneSchema, trackSlugSchema } from './common';

const goalMinutes = z.number().int().min(0).max(480);

export const dailyGoalsSchema = z.record(trackSlugSchema, goalMinutes);

export const preferencesSchema = z.object({
  displayName: z.string().trim().min(1).max(60),
  locale: localeSchema,
  theme: themeSchema,
  timezone: timeZoneSchema,
  dailyGoals: dailyGoalsSchema,
  streakMinMinutes: z.number().int().min(1).max(240),
});
export type Preferences = z.infer<typeof preferencesSchema>;

export const updatePreferencesSchema = z
  .strictObject({
    displayName: z.string().trim().min(1).max(60),
    locale: localeSchema,
    theme: themeSchema,
    timezone: timeZoneSchema,
    dailyGoals: z.partialRecord(trackSlugSchema, goalMinutes),
    streakMinMinutes: z.number().int().min(1).max(240),
  })
  .partial();
export type UpdatePreferences = z.infer<typeof updatePreferencesSchema>;
