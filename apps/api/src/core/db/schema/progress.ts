import { ACTIVITY_TYPES, PROGRESS_STATUSES, TRACK_SLUGS } from '@dlos/shared';
import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createdAt, jsonColumn, pk, updatedAt } from './helpers';
import { lessons } from './curriculum';
import { studyPlanTasks } from './plan';
import { users } from './users';

export const lessonProgress = sqliteTable(
  'lesson_progress',
  {
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    lessonId: integer('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    status: text('status', { enum: PROGRESS_STATUSES }).notNull().default('not_started'),
    progressPercent: integer('progress_percent').notNull().default(0),
    lastPosition: jsonColumn<{ section?: string; scrollRatio?: number }>('last_position'),
    locale: text('locale'),
    startedAt: text('started_at'),
    completedAt: text('completed_at'),
    lastAccessedAt: text('last_accessed_at'),
    updatedAt: updatedAt(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.lessonId] }),
    index('lesson_progress_user_status_idx').on(table.userId, table.status, table.lastAccessedAt),
  ],
);

/** Append-only log used for the activity feed. `localDate` is the learner's calendar date. */
export const progressEvents = sqliteTable(
  'progress_events',
  {
    id: pk(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    eventType: text('event_type', { enum: ACTIVITY_TYPES }).notNull(),
    entityType: text('entity_type').notNull(),
    entityId: integer('entity_id'),
    payload: jsonColumn<Record<string, unknown>>('payload').notNull(),
    occurredAt: text('occurred_at').notNull(),
    localDate: text('local_date').notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    index('progress_events_user_time_idx').on(table.userId, table.occurredAt),
    index('progress_events_entity_idx').on(table.entityType, table.entityId),
  ],
);

export const studySessions = sqliteTable(
  'study_sessions',
  {
    id: pk(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    trackSlug: text('track_slug', { enum: TRACK_SLUGS }).notNull(),
    startedAt: text('started_at').notNull(),
    durationMinutes: integer('duration_minutes').notNull(),
    localDate: text('local_date').notNull(),
    source: text('source', { enum: ['timer', 'manual'] }).notNull(),
    lessonId: integer('lesson_id').references(() => lessons.id, { onDelete: 'set null' }),
    planTaskId: integer('plan_task_id').references(() => studyPlanTasks.id, {
      onDelete: 'set null',
    }),
    note: text('note'),
    createdAt: createdAt(),
  },
  (table) => [index('study_sessions_user_date_idx').on(table.userId, table.localDate)],
);
