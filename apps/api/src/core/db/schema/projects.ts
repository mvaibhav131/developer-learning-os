import { CONTENT_STATUSES, DIFFICULTIES, PROJECT_STATUSES } from '@dlos/shared';
import { integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { createdAt, jsonColumn, pk, updatedAt } from './helpers';
import { users } from './users';

export const projects = sqliteTable('projects', {
  id: pk(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  goal: text('goal').notNull(),
  summary: text('summary').notNull(),
  difficulty: text('difficulty', { enum: DIFFICULTIES }).notNull(),
  estimatedHours: integer('estimated_hours').notNull(),
  prerequisites: jsonColumn<string[]>('prerequisites').notNull(),
  stack: jsonColumn<string[]>('stack').notNull(),
  contentStatus: text('content_status', { enum: CONTENT_STATUSES }).notNull().default('planned'),
  sortOrder: integer('sort_order').notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const projectMilestones = sqliteTable(
  'project_milestones',
  {
    id: pk(),
    projectId: integer('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description').notNull(),
    sortOrder: integer('sort_order').notNull(),
  },
  (table) => [uniqueIndex('project_milestones_project_order_idx').on(table.projectId, table.sortOrder)],
);

export const userProjects = sqliteTable(
  'user_projects',
  {
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    projectId: integer('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    status: text('status', { enum: PROJECT_STATUSES }).notNull().default('not_started'),
    startedAt: text('started_at'),
    completedAt: text('completed_at'),
    repositoryUrl: text('repository_url'),
    notes: text('notes'),
    updatedAt: updatedAt(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.projectId] })],
);

export const userProjectMilestones = sqliteTable(
  'user_project_milestones',
  {
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    milestoneId: integer('milestone_id')
      .notNull()
      .references(() => projectMilestones.id, { onDelete: 'cascade' }),
    completedAt: text('completed_at').notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.milestoneId] })],
);
