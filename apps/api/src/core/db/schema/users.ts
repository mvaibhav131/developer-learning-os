import {
  DEFAULT_LOCALE,
  DEFAULT_STREAK_MIN_MINUTES,
  LOCALES,
  THEMES,
  type TrackSlug,
} from '@dlos/shared';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createdAt, jsonColumn, pk, updatedAt } from './helpers';

export const users = sqliteTable('users', {
  id: pk(),
  handle: text('handle').notNull().unique(),
  displayName: text('display_name').notNull(),
  email: text('email'),
  role: text('role', { enum: ['owner'] })
    .notNull()
    .default('owner'),
  createdAt: createdAt(),
});

export const userPreferences = sqliteTable('user_preferences', {
  userId: integer('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  locale: text('locale', { enum: LOCALES }).notNull().default(DEFAULT_LOCALE),
  theme: text('theme', { enum: THEMES }).notNull().default('system'),
  timezone: text('timezone').notNull(),
  weekStartsOn: integer('week_starts_on').notNull().default(1),
  dailyGoals: jsonColumn<Record<TrackSlug, number>>('daily_goals').notNull(),
  streakMinMinutes: integer('streak_min_minutes').notNull().default(DEFAULT_STREAK_MIN_MINUTES),
  updatedAt: updatedAt(),
});

/** Provider choices only. API keys are read from environment variables on the server, never stored. */
export const aiSettings = sqliteTable('ai_settings', {
  userId: integer('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider', { enum: ['none', 'ollama', 'openai-compatible'] })
    .notNull()
    .default('none'),
  baseUrl: text('base_url'),
  chatModel: text('chat_model'),
  embeddingModel: text('embedding_model'),
  apiKeyEnvVar: text('api_key_env_var'),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(false),
  updatedAt: updatedAt(),
});
