import {
  PROBLEM_DIFFICULTIES,
  type HarnessCodec,
  type HarnessOrdering,
  type Locale,
} from '@dlos/shared';
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
import { createdAt, jsonColumn, pk, updatedAt } from './helpers';
import { lessons } from './curriculum';
import { users } from './users';

export const quizzes = sqliteTable('quizzes', {
  id: pk(),
  slug: text('slug').notNull().unique(),
  lessonId: integer('lesson_id').references(() => lessons.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  description: text('description'),
  passPercent: integer('pass_percent').notNull().default(70),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export interface QuizOption {
  id: string;
  text: string;
}

export const quizQuestions = sqliteTable(
  'quiz_questions',
  {
    id: pk(),
    quizId: integer('quiz_id')
      .notNull()
      .references(() => quizzes.id, { onDelete: 'cascade' }),
    kind: text('kind', { enum: ['single', 'multiple', 'true-false'] }).notNull(),
    prompt: text('prompt').notNull(),
    options: jsonColumn<QuizOption[]>('options').notNull(),
    correctOptionIds: jsonColumn<string[]>('correct_option_ids').notNull(),
    explanation: text('explanation').notNull(),
    /** Separately authored translations keyed by locale; missing locales fall back to English. */
    translations:
      jsonColumn<
        Partial<Record<Locale, { prompt: string; options: QuizOption[]; explanation: string }>>
      >('translations'),
    sortOrder: integer('sort_order').notNull(),
  },
  (table) => [index('quiz_questions_quiz_idx').on(table.quizId, table.sortOrder)],
);

export const quizAttempts = sqliteTable(
  'quiz_attempts',
  {
    id: pk(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    quizId: integer('quiz_id')
      .notNull()
      .references(() => quizzes.id, { onDelete: 'cascade' }),
    score: integer('score').notNull(),
    maxScore: integer('max_score').notNull(),
    passed: integer('passed', { mode: 'boolean' }).notNull(),
    answers: jsonColumn<Record<string, string[]>>('answers').notNull(),
    durationSeconds: integer('duration_seconds'),
    createdAt: createdAt(),
  },
  (table) => [index('quiz_attempts_user_idx').on(table.userId, table.quizId, table.createdAt)],
);

export interface ProblemHarness {
  argCodecs?: HarnessCodec[];
  returnCodec?: HarnessCodec;
  ordering?: HarnessOrdering;
  inPlace?: boolean;
  float?: boolean;
}

export interface ProblemWalkthrough {
  solution?: { code: string; explanation: string; timeComplexity: string; spaceComplexity: string };
  videoIds?: string[];
}

export const codingProblems = sqliteTable('coding_problems', {
  id: pk(),
  slug: text('slug').notNull().unique(),
  lessonId: integer('lesson_id').references(() => lessons.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  difficulty: text('difficulty', { enum: PROBLEM_DIFFICULTIES }).notNull(),
  topics: jsonColumn<string[]>('topics').notNull(),
  statementMarkdown: text('statement_markdown').notNull(),
  constraintsMarkdown: text('constraints_markdown'),
  examples: jsonColumn<Array<{ input: string; output: string; explanation?: string }>>('examples').notNull(),
  starterCode: jsonColumn<{ javascript: string; typescript: string }>('starter_code').notNull(),
  functionName: text('function_name').notNull(),
  harness: jsonColumn<ProblemHarness>('harness').notNull().default({}),
  testCases: jsonColumn<Array<{ args: unknown[]; expected: unknown; hidden?: boolean }>>('test_cases').notNull(),
  hints: jsonColumn<string[]>('hints').notNull(),
  walkthrough: jsonColumn<ProblemWalkthrough>('walkthrough'),
  source: text('source', { enum: ['original', 'external-link'] }).notNull().default('original'),
  externalUrl: text('external_url'),
  license: text('license'),
  contentStatus: text('content_status', { enum: ['planned', 'in_progress', 'complete'] })
    .notNull()
    .default('planned'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const codingAttempts = sqliteTable(
  'coding_attempts',
  {
    id: pk(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    problemId: integer('problem_id')
      .notNull()
      .references(() => codingProblems.id, { onDelete: 'cascade' }),
    language: text('language', { enum: ['javascript', 'typescript'] }).notNull(),
    kind: text('kind', { enum: ['run', 'submit'] }).notNull(),
    code: text('code').notNull(),
    status: text('status', { enum: ['passed', 'partial', 'failed', 'error', 'timeout'] }).notNull(),
    passedCount: integer('passed_count').notNull(),
    totalCount: integer('total_count').notNull(),
    runtimeMs: integer('runtime_ms'),
    createdAt: createdAt(),
  },
  (table) => [index('coding_attempts_user_problem_idx').on(table.userId, table.problemId, table.createdAt)],
);

/** Spaced repetition state (SM-2 style). `dueDate` is a local date (YYYY-MM-DD). */
export const reviewSchedules = sqliteTable(
  'review_schedules',
  {
    id: pk(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    itemType: text('item_type', { enum: ['problem', 'flashcard', 'lesson', 'quiz'] }).notNull(),
    itemId: integer('item_id').notNull(),
    easeFactor: real('ease_factor').notNull().default(2.5),
    intervalDays: integer('interval_days').notNull().default(1),
    repetitions: integer('repetitions').notNull().default(0),
    lapses: integer('lapses').notNull().default(0),
    dueDate: text('due_date').notNull(),
    lastReviewedAt: text('last_reviewed_at'),
    lastOutcome: text('last_outcome', { enum: ['again', 'hard', 'good', 'easy'] }),
    status: text('status', { enum: ['active', 'suspended'] }).notNull().default('active'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex('review_schedules_item_idx').on(table.userId, table.itemType, table.itemId),
    index('review_schedules_due_idx').on(table.userId, table.status, table.dueDate),
  ],
);
