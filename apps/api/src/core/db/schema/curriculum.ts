import {
  CONTENT_STATUSES,
  DIFFICULTIES,
  LESSON_KINDS,
  LOCALES,
  TRACK_SLUGS,
} from '@dlos/shared';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { createdAt, jsonColumn, pk, updatedAt } from './helpers';

export const learningTracks = sqliteTable('learning_tracks', {
  id: pk(),
  slug: text('slug', { enum: TRACK_SLUGS }).notNull().unique(),
  title: text('title').notNull(),
  shortTitle: text('short_title').notNull(),
  description: text('description').notNull(),
  icon: text('icon').notNull(),
  sortOrder: integer('sort_order').notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const courses = sqliteTable(
  'courses',
  {
    id: pk(),
    trackId: integer('track_id')
      .notNull()
      .references(() => learningTracks.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    subtitle: text('subtitle').notNull(),
    description: text('description').notNull(),
    difficulty: text('difficulty', { enum: DIFFICULTIES }).notNull(),
    icon: text('icon').notNull(),
    tags: jsonColumn<string[]>('tags').notNull(),
    outcomes: jsonColumn<string[]>('outcomes').notNull(),
    sortOrder: integer('sort_order').notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index('courses_track_idx').on(table.trackId, table.sortOrder)],
);

export const modules = sqliteTable(
  'modules',
  {
    id: pk(),
    courseId: integer('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    sortOrder: integer('sort_order').notNull(),
  },
  (table) => [uniqueIndex('modules_course_slug_idx').on(table.courseId, table.slug)],
);

export const lessons = sqliteTable(
  'lessons',
  {
    id: pk(),
    moduleId: integer('module_id')
      .notNull()
      .references(() => modules.id, { onDelete: 'cascade' }),
    courseId: integer('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    summary: text('summary'),
    difficulty: text('difficulty', { enum: DIFFICULTIES }).notNull(),
    kind: text('kind', { enum: LESSON_KINDS }).notNull().default('lesson'),
    estimatedMinutes: integer('estimated_minutes').notNull(),
    contentStatus: text('content_status', { enum: CONTENT_STATUSES }).notNull().default('planned'),
    contentVersion: integer('content_version').notNull().default(0),
    tags: jsonColumn<string[]>('tags').notNull(),
    sortOrder: integer('sort_order').notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index('lessons_module_idx').on(table.moduleId, table.sortOrder),
    index('lessons_course_idx').on(table.courseId, table.sortOrder),
  ],
);

/** Separately authored translations. A missing row means "fall back to English", never auto-translate. */
export const lessonTranslations = sqliteTable(
  'lesson_translations',
  {
    id: pk(),
    lessonId: integer('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    locale: text('locale', { enum: LOCALES }).notNull(),
    title: text('title').notNull(),
    summary: text('summary'),
    bodyMarkdown: text('body_markdown').notNull(),
    reviewStatus: text('review_status', { enum: ['draft', 'reviewed'] })
      .notNull()
      .default('draft'),
    contentHash: text('content_hash').notNull(),
    updatedAt: updatedAt(),
  },
  (table) => [uniqueIndex('lesson_translations_lesson_locale_idx').on(table.lessonId, table.locale)],
);
