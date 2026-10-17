import { DIFFICULTIES, LOCALES } from '@dlos/shared';
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core';
import { createdAt, jsonColumn, pk, updatedAt } from './helpers';
import { lessons } from './curriculum';

export const RESOURCE_TYPES = [
  'video',
  'playlist',
  'course',
  'documentation',
  'repository',
  'article',
  'book',
  'tool',
  'sheet',
] as const;
export const RESOURCE_COSTS = [
  'free',
  'free-to-watch',
  'open-source',
  'freemium',
  'paid',
] as const;
export const VERIFICATION_STATUSES = [
  'unverified',
  'verified',
  'redirected',
  'blocked',
  'broken',
] as const;

export const learningResources = sqliteTable(
  'learning_resources',
  {
    id: pk(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    author: text('author').notNull(),
    url: text('url').notNull().unique(),
    language: text('language', { enum: [...LOCALES, 'multi'] }).notNull(),
    resourceType: text('resource_type', { enum: RESOURCE_TYPES }).notNull(),
    cost: text('cost', { enum: RESOURCE_COSTS }).notNull(),
    license: text('license'),
    difficulty: text('difficulty', { enum: DIFFICULTIES }).notNull(),
    topics: jsonColumn<string[]>('topics').notNull(),
    trackSlug: text('track_slug'),
    /** Only set when the duration was verified at the source. Never estimated. */
    durationMinutes: integer('duration_minutes'),
    embeddable: integer('embeddable', { mode: 'boolean' }).notNull().default(false),
    embedUrl: text('embed_url'),
    verificationStatus: text('verification_status', { enum: VERIFICATION_STATUSES })
      .notNull()
      .default('unverified'),
    lastCheckedAt: text('last_checked_at'),
    notes: text('notes'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index('resources_track_idx').on(table.trackSlug, table.resourceType)],
);

export const resourceVerifications = sqliteTable(
  'resource_verifications',
  {
    id: pk(),
    resourceId: integer('resource_id')
      .notNull()
      .references(() => learningResources.id, { onDelete: 'cascade' }),
    checkedAt: text('checked_at').notNull(),
    status: text('status', { enum: VERIFICATION_STATUSES }).notNull(),
    httpStatus: integer('http_status'),
    finalUrl: text('final_url'),
    method: text('method', { enum: ['head', 'get', 'manual'] }).notNull(),
    note: text('note'),
  },
  (table) => [index('resource_verifications_resource_idx').on(table.resourceId, table.checkedAt)],
);

export const lessonResources = sqliteTable(
  'lesson_resources',
  {
    lessonId: integer('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    resourceId: integer('resource_id')
      .notNull()
      .references(() => learningResources.id, { onDelete: 'cascade' }),
    role: text('role').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.lessonId, table.resourceId] })],
);
