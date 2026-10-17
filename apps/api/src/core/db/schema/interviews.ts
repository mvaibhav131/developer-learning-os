import { CONTENT_STATUSES, DIFFICULTIES } from '@dlos/shared';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createdAt, jsonColumn, pk, updatedAt } from './helpers';
import { users } from './users';

export const INTERVIEW_ROLES = [
  'senior-fullstack',
  'senior-backend',
  'ai-engineer',
  'llm-application-engineer',
  'rag-engineer',
  'system-design',
  'dsa',
] as const;

export interface RubricCriterion {
  key: string;
  label: string;
  weight: number;
  description: string;
}

export const interviews = sqliteTable(
  'interviews',
  {
    id: pk(),
    slug: text('slug').notNull().unique(),
    role: text('role', { enum: INTERVIEW_ROLES }).notNull(),
    kind: text('kind', { enum: ['question', 'scenario', 'mock-session'] }).notNull(),
    title: text('title').notNull(),
    promptMarkdown: text('prompt_markdown').notNull(),
    difficulty: text('difficulty', { enum: DIFFICULTIES }).notNull(),
    timeLimitMinutes: integer('time_limit_minutes'),
    answerMarkdown: text('answer_markdown').notNull(),
    rubric: jsonColumn<RubricCriterion[]>('rubric').notNull(),
    followUps: jsonColumn<string[]>('follow_ups').notNull(),
    tags: jsonColumn<string[]>('tags').notNull(),
    contentStatus: text('content_status', { enum: CONTENT_STATUSES }).notNull().default('planned'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index('interviews_role_idx').on(table.role, table.difficulty)],
);

export const interviewAttempts = sqliteTable(
  'interview_attempts',
  {
    id: pk(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    interviewId: integer('interview_id')
      .notNull()
      .references(() => interviews.id, { onDelete: 'cascade' }),
    answerMarkdown: text('answer_markdown').notNull(),
    selfScores: jsonColumn<Record<string, number>>('self_scores').notNull(),
    totalScore: integer('total_score').notNull(),
    maxScore: integer('max_score').notNull(),
    durationSeconds: integer('duration_seconds'),
    /** Filled only when a real model was called; `aiProvider` and `aiModel` record which one. */
    aiFeedback: jsonColumn<Record<string, unknown>>('ai_feedback'),
    aiProvider: text('ai_provider'),
    aiModel: text('ai_model'),
    createdAt: createdAt(),
  },
  (table) => [index('interview_attempts_user_idx').on(table.userId, table.interviewId, table.createdAt)],
);

export const diagrams = sqliteTable(
  'diagrams',
  {
    id: pk(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    graph: jsonColumn<{
      nodes: unknown[];
      edges: unknown[];
      viewport?: { x: number; y: number; zoom: number };
    }>('graph').notNull(),
    caseStudySlug: text('case_study_slug'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index('diagrams_user_idx').on(table.userId, table.updatedAt)],
);
