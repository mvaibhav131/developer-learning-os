import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { createdAt, pk, updatedAt } from './helpers';
import { lessons } from './curriculum';
import { users } from './users';

export const notes = sqliteTable(
  'notes',
  {
    id: pk(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    bodyMarkdown: text('body_markdown').notNull(),
    lessonId: integer('lesson_id').references(() => lessons.id, { onDelete: 'set null' }),
    pinned: integer('pinned', { mode: 'boolean' }).notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index('notes_user_updated_idx').on(table.userId, table.updatedAt)],
);

export const bookmarks = sqliteTable(
  'bookmarks',
  {
    id: pk(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    entityType: text('entity_type', {
      enum: ['lesson', 'course', 'problem', 'resource', 'note', 'interview', 'project'],
    }).notNull(),
    entityId: integer('entity_id').notNull(),
    label: text('label'),
    createdAt: createdAt(),
  },
  (table) => [uniqueIndex('bookmarks_entity_idx').on(table.userId, table.entityType, table.entityId)],
);

export const tags = sqliteTable(
  'tags',
  {
    id: pk(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
  },
  (table) => [uniqueIndex('tags_user_name_idx').on(table.userId, table.name)],
);

/** Polymorphic join so notes, flashcards and bookmarks share one tag vocabulary. */
export const taggings = sqliteTable(
  'taggings',
  {
    tagId: integer('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
    entityType: text('entity_type', { enum: ['note', 'flashcard', 'bookmark'] }).notNull(),
    entityId: integer('entity_id').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.tagId, table.entityType, table.entityId] }),
    index('taggings_entity_idx').on(table.entityType, table.entityId),
  ],
);

export const flashcards = sqliteTable(
  'flashcards',
  {
    id: pk(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    lessonId: integer('lesson_id').references(() => lessons.id, { onDelete: 'set null' }),
    frontMarkdown: text('front_markdown').notNull(),
    backMarkdown: text('back_markdown').notNull(),
    source: text('source', { enum: ['user', 'lesson', 'problem'] }).notNull().default('user'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index('flashcards_user_idx').on(table.userId, table.createdAt)],
);
