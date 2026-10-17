import { PLAN_TASK_KINDS, TRACK_SLUGS } from '@dlos/shared';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { createdAt, jsonColumn, pk, updatedAt } from './helpers';
import { lessons } from './curriculum';
import { users } from './users';

/** A user-owned copy of the roadmap template, so edits and progress never touch shared content. */
export const studyPlans = sqliteTable(
  'study_plans',
  {
    id: pk(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    templateKey: text('template_key').notNull(),
    startDate: text('start_date').notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index('study_plans_user_idx').on(table.userId, table.isActive)],
);

export const studyPlanWeeks = sqliteTable(
  'study_plan_weeks',
  {
    id: pk(),
    planId: integer('plan_id')
      .notNull()
      .references(() => studyPlans.id, { onDelete: 'cascade' }),
    weekNumber: integer('week_number').notNull(),
    phaseKey: text('phase_key').notNull(),
    phaseTitle: text('phase_title').notNull(),
    title: text('title').notNull(),
    summary: text('summary').notNull(),
    goals: jsonColumn<string[]>('goals').notNull(),
    deliverable: text('deliverable').notNull(),
  },
  (table) => [uniqueIndex('study_plan_weeks_plan_week_idx').on(table.planId, table.weekNumber)],
);

export const studyPlanTasks = sqliteTable(
  'study_plan_tasks',
  {
    id: pk(),
    planId: integer('plan_id')
      .notNull()
      .references(() => studyPlans.id, { onDelete: 'cascade' }),
    weekNumber: integer('week_number').notNull(),
    dayOffset: integer('day_offset').notNull(),
    trackSlug: text('track_slug', { enum: TRACK_SLUGS }).notNull(),
    kind: text('kind', { enum: PLAN_TASK_KINDS }).notNull(),
    title: text('title').notNull(),
    description: text('description'),
    plannedMinutes: integer('planned_minutes').notNull(),
    lessonId: integer('lesson_id').references(() => lessons.id, { onDelete: 'set null' }),
    projectSlug: text('project_slug'),
    isOptional: integer('is_optional', { mode: 'boolean' }).notNull().default(false),
    isCustom: integer('is_custom', { mode: 'boolean' }).notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    completedAt: text('completed_at'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index('study_plan_tasks_slot_idx').on(table.planId, table.weekNumber, table.dayOffset),
    index('study_plan_tasks_completed_idx').on(table.planId, table.completedAt),
  ],
);
