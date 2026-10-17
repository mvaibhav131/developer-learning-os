export const API_PREFIX = '/api/v1';

export const TRACK_SLUGS = [
  'ai',
  'dsa',
  'system-design',
  'full-stack',
  'interview',
  'english',
] as const;
export type TrackSlug = (typeof TRACK_SLUGS)[number];

/** Hinglish (Hindi written in Latin script) is the default explanation language. */
export const LOCALES = ['hi-Latn', 'en', 'hi'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'hi-Latn';
export const LOCALE_LABELS: Record<Locale, { native: string; english: string }> = {
  'hi-Latn': { native: 'Hinglish', english: 'Hinglish (Hindi in Latin script)' },
  en: { native: 'English', english: 'English' },
  hi: { native: 'हिन्दी', english: 'Hindi (Devanagari)' },
};

export const THEMES = ['system', 'light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

export const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const PROBLEM_DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type ProblemDifficulty = (typeof PROBLEM_DIFFICULTIES)[number];

export const PROBLEM_STATUSES = ['unsolved', 'attempted', 'solved'] as const;
export type ProblemStatus = (typeof PROBLEM_STATUSES)[number];

export const PRACTICE_LANGUAGES = ['typescript', 'javascript'] as const;
export type PracticeLanguage = (typeof PRACTICE_LANGUAGES)[number];

export const ATTEMPT_KINDS = ['run', 'submit'] as const;
export type AttemptKind = (typeof ATTEMPT_KINDS)[number];

export const ATTEMPT_STATUSES = ['passed', 'partial', 'failed', 'error', 'timeout'] as const;
export type AttemptStatus = (typeof ATTEMPT_STATUSES)[number];

/** How the test harness turns JSON test data into runtime values (and back). */
export const HARNESS_CODECS = ['plain', 'list', 'tree'] as const;
export type HarnessCodec = (typeof HARNESS_CODECS)[number];

export const HARNESS_ORDERINGS = ['exact', 'any-order', 'any-order-groups'] as const;
export type HarnessOrdering = (typeof HARNESS_ORDERINGS)[number];

export const MAX_ATTEMPT_CODE_LENGTH = 50_000;

export const CONTENT_STATUSES = ['planned', 'in_progress', 'complete'] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const LESSON_KINDS = ['lesson', 'case-study', 'lab', 'revision', 'assessment'] as const;
export type LessonKind = (typeof LESSON_KINDS)[number];

export const PROGRESS_STATUSES = ['not_started', 'in_progress', 'completed'] as const;
export type ProgressStatus = (typeof PROGRESS_STATUSES)[number];

export const PLAN_TASK_KINDS = [
  'lesson',
  'practice',
  'revision',
  'project',
  'assessment',
  'interview',
] as const;
export type PlanTaskKind = (typeof PLAN_TASK_KINDS)[number];

export const PLAN_STATES = ['none', 'upcoming', 'active', 'completed'] as const;
export type PlanState = (typeof PLAN_STATES)[number];

export const ROADMAP_WEEK_COUNT = 24;
/** Days 0-4 of every plan week are core study days, days 5-6 hold optional sessions. */
export const CORE_DAYS_PER_WEEK = 5;

export const ACTIVITY_TYPES = [
  'study_session',
  'task_completed',
  'lesson_completed',
  'problem_solved',
  'plan_started',
  'plan_reset',
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const ACHIEVEMENT_KEYS = [
  'first-session',
  'first-task',
  'streak-3',
  'streak-7',
  'streak-30',
  'hours-10',
  'hours-50',
  'hours-100',
  'balanced-day',
  'perfect-week',
] as const;
export type AchievementKey = (typeof ACHIEVEMENT_KEYS)[number];

export const SEARCH_ENTITY_TYPES = ['track', 'course', 'lesson', 'project', 'problem'] as const;
export type SearchEntityType = (typeof SEARCH_ENTITY_TYPES)[number];

export const PROJECT_STATUSES = ['not_started', 'in_progress', 'completed'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const DEFAULT_DAILY_GOALS: Record<TrackSlug, number> = {
  ai: 60,
  dsa: 30,
  'system-design': 30,
  'full-stack': 0,
  interview: 0,
  english: 0,
};

export const DEFAULT_STREAK_MIN_MINUTES = 10;
export const MAX_SESSION_MINUTES = 600;
