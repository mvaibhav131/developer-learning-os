import type {
  Dashboard,
  Health,
  LessonDetail,
  ListProblemsResponse,
  Preferences,
  ProblemDetail,
  ProjectDetail,
  ProjectSummary,
  QuizDetail,
  QuizResult,
  TrackSummary,
} from '@dlos/shared';
import type { FakeRequest } from './fake-api';

export const TODAY = '2026-10-19';

/** A PATCH /preferences handler that echoes the stored preferences merged with the request body. */
export const patchPreferences =
  (base: Preferences) =>
  ({ body }: FakeRequest): Preferences => ({ ...base, ...(body as Partial<Preferences>) });

export function makePreferences(overrides: Partial<Preferences> = {}): Preferences {
  return {
    displayName: 'Asha',
    locale: 'hi-Latn',
    theme: 'system',
    timezone: 'Asia/Kolkata',
    dailyGoals: { ai: 60, dsa: 30, 'system-design': 30, 'full-stack': 0, interview: 0, english: 0 },
    streakMinMinutes: 10,
    ...overrides,
  };
}

export function makeHealth(overrides: Partial<Health> = {}): Health {
  return {
    status: 'ok',
    version: '0.1.0',
    environment: 'test',
    time: '2026-10-19T05:00:00.000Z',
    uptimeSeconds: 12,
    database: { status: 'ok', appliedMigrations: 1 },
    content: { tracks: 6, courses: 25, lessons: 297, lessonsWithContent: 0 },
    ai: { provider: 'none', status: 'not_configured', message: 'No AI provider is configured.' },
    ...overrides,
  };
}

export function makeTrack(overrides: Partial<TrackSummary> = {}): TrackSummary {
  return {
    slug: 'ai',
    title: 'AI Engineering',
    shortTitle: 'AI',
    description: 'Build LLM applications from prompts to production.',
    icon: 'brain',
    sortOrder: 1,
    contentStatus: 'planned',
    courseCount: 6,
    stats: {
      moduleCount: 18,
      lessonCount: 80,
      completeLessonCount: 0,
      estimatedMinutes: 4000,
      completedByUser: 0,
    },
    ...overrides,
  };
}

export function makeTracks(): { tracks: TrackSummary[] } {
  return {
    tracks: [
      makeTrack(),
      makeTrack({ slug: 'dsa', title: 'Data Structures and Algorithms', shortTitle: 'DSA', sortOrder: 2 }),
    ],
  };
}

export function makeDashboard(overrides: Partial<Dashboard> = {}): Dashboard {
  return {
    generatedAt: '2026-10-19T05:00:00.000Z',
    today: TODAY,
    timezone: 'Asia/Kolkata',
    profile: { displayName: 'Asha' },
    plan: {
      state: 'active',
      startDate: TODAY,
      endDate: '2027-04-04',
      daysUntilStart: null,
      currentWeek: 1,
      totalWeeks: 24,
      week: {
        weekNumber: 1,
        title: 'LLM foundations',
        phaseKey: 'ai-foundations',
        phaseTitle: 'AI foundations',
        summary: 'Tokens, prompts and your first API calls.',
        goals: ['Explain tokenization', 'Call a model from TypeScript'],
        deliverable: 'A typed LLM client',
        coreTasks: 15,
        coreCompleted: 1,
        optionalTasks: 4,
        optionalCompleted: 0,
      },
      overall: { coreTasks: 360, coreCompleted: 1, percent: 0 },
    },
    daily: {
      targetMinutes: 120,
      studiedMinutes: 45,
      percent: 38,
      byTrack: [
        { trackSlug: 'ai', targetMinutes: 60, studiedMinutes: 45 },
        { trackSlug: 'dsa', targetMinutes: 30, studiedMinutes: 0 },
        { trackSlug: 'system-design', targetMinutes: 30, studiedMinutes: 0 },
      ],
    },
    todayTasks: [
      {
        id: 101,
        weekNumber: 1,
        dayOffset: 0,
        scheduledDate: TODAY,
        trackSlug: 'ai',
        kind: 'lesson',
        title: 'How LLMs work',
        description: null,
        plannedMinutes: 60,
        isOptional: false,
        isCustom: false,
        completedAt: null,
        projectSlug: null,
        lesson: null,
      },
      {
        id: 102,
        weekNumber: 1,
        dayOffset: 0,
        scheduledDate: TODAY,
        trackSlug: 'dsa',
        kind: 'practice',
        title: 'Arrays and hashing drills',
        description: null,
        plannedMinutes: 30,
        isOptional: false,
        isCustom: false,
        completedAt: '2026-10-19T04:00:00.000Z',
        projectSlug: null,
        lesson: null,
      },
    ],
    nextUp: null,
    weekly: {
      weekStart: TODAY,
      totalMinutes: 45,
      targetMinutes: 600,
      days: [
        { date: TODAY, minutes: 45, byTrack: { ai: 45, dsa: 0, 'system-design': 0, 'full-stack': 0, interview: 0, english: 0 } },
      ],
    },
    streak: { current: 4, longest: 9, lastActiveDate: TODAY, todayCounts: true, minMinutes: 10 },
    lessons: { completed: 0, inProgress: 0, catalogTotal: 258, authoredTotal: 0 },
    continueLearning: [],
    continueLesson: {
      slug: 'big-o-analysis',
      title: 'Big O analysis: time, space and amortized cost',
      trackSlug: 'dsa',
      courseSlug: 'dsa-foundations',
      courseTitle: 'DSA Foundations and Core Patterns',
      minutes: 40,
      reason: 'start',
      hasVideo: true,
    },
    practice: { total: 30, solved: 2, attempted: 1 },
    reviews: { dueToday: 0, upcoming: [] },
    focusAreas: [],
    upcomingAssignments: [],
    projects: { total: 10, started: 0, completed: 0, milestonesDone: 0, milestonesTotal: 50, active: [] },
    readiness: { percent: 0, signals: [{ key: 'plan_progress', percent: 0, weight: 1 }] },
    recentActivity: [],
    achievements: [{ key: 'first-session', unlocked: true, current: 1, target: 1 }],
    ...overrides,
  };
}

export function makeProjectSummary(overrides: Partial<ProjectSummary> = {}): ProjectSummary {
  return {
    slug: 'ts-llm-api-client',
    title: 'Lab 1: Typed LLM API client',
    goal: 'Build a small typed client that streams chat completions.',
    difficulty: 'beginner',
    estimatedHours: 6,
    contentStatus: 'planned',
    status: 'not_started',
    milestonesTotal: 2,
    milestonesDone: 0,
    ...overrides,
  };
}

export function makeProjectDetail(done: number[] = []): ProjectDetail {
  const milestones = [
    { id: 11, title: 'Typed request builder', description: 'Model the request with Zod.' },
    { id: 12, title: 'Streaming parser', description: 'Parse server-sent events.' },
  ].map((milestone) => ({
    ...milestone,
    completedAt: done.includes(milestone.id) ? '2026-10-19T06:00:00.000Z' : null,
  }));
  const milestonesDone = milestones.filter((milestone) => milestone.completedAt).length;
  return {
    project: {
      ...makeProjectSummary({
        status: milestonesDone === 0 ? 'not_started' : 'in_progress',
        milestonesDone,
      }),
      summary: 'A typed wrapper around an OpenAI-compatible endpoint.',
      prerequisites: [
        { slug: 'llm-api-integration', title: 'LLM API integration patterns', type: 'lesson' },
        { slug: 'pdf-qa-app', title: 'Lab 4: PDF Q&A application', type: 'project' },
      ],
      stack: ['TypeScript', 'Zod'],
      startedAt: milestonesDone === 0 ? null : '2026-10-19T05:30:00.000Z',
      completedAt: null,
    },
    milestones,
  };
}

export const LESSON_BODY = [
  '## The idea',
  '',
  'Use a `Map` to turn a slow search into a lookup.',
  '',
  '```ts',
  'const seen = new Map<number, number>();',
  '```',
  '',
  '## Words to remember',
  '',
  '| Word | Meaning |',
  '| --- | --- |',
  '| cache | a stored copy for fast reuse |',
  '',
  '## Say it aloud',
  '',
  '```phrases',
  'Could you say that again, please?',
  '```',
].join('\n');

export function makeLessonDetail(overrides: Partial<LessonDetail> = {}): LessonDetail {
  return {
    lesson: {
      slug: 'hashing-interview-patterns',
      title: 'Hashing patterns: two-sum family, anagrams and grouping',
      summary: 'Turn slow nested searches into constant-time lookups.',
      difficulty: 'intermediate',
      kind: 'lesson',
      estimatedMinutes: 35,
      contentStatus: 'complete',
      progress: 'not_started',
      availableLocales: ['en'],
      tags: ['hashing'],
      completedAt: null,
    },
    course: { slug: 'dsa-foundations', title: 'DSA Foundations and Core Patterns', trackSlug: 'dsa' },
    module: { slug: 'hashing', title: 'Hashing' },
    previous: { slug: 'sets-and-deduplication', title: 'Sets, deduplication and membership' },
    next: { slug: 'two-pointers-opposite-ends', title: 'Two pointers: opposite ends' },
    content: {
      locale: 'en',
      isFallback: false,
      title: 'Hashing patterns: two-sum family, anagrams and grouping',
      bodyMarkdown: LESSON_BODY,
    },
    videos: [
      {
        id: 'KLlXCFG5TnA',
        title: 'Two Sum - Leetcode 1 - HashMap - Python',
        author: 'NeetCode',
        language: 'en',
        watchUrl: 'https://www.youtube.com/watch?v=KLlXCFG5TnA',
        embedUrl: 'https://www.youtube-nocookie.com/embed/KLlXCFG5TnA',
      },
      {
        id: 'W5q0xgxmRd8',
        title: 'L-6.1: What is hashing with example | Hashing in data structure',
        author: 'Gate Smashers',
        language: 'hi',
        watchUrl: 'https://www.youtube.com/watch?v=W5q0xgxmRd8',
        embedUrl: 'https://www.youtube-nocookie.com/embed/W5q0xgxmRd8',
      },
    ],
    practice: [{ slug: 'two-sum', title: 'Two Sum', difficulty: 'easy', status: 'solved' }],
    quiz: { slug: 'hashing-interview-patterns', title: 'Check your understanding', questionCount: 3, passPercent: 70, best: null },
    ...overrides,
  };
}

export function makeQuizDetail(): QuizDetail {
  return {
    quiz: { slug: 'hashing-interview-patterns', title: 'Check your understanding', questionCount: 3, passPercent: 70, best: null },
    questions: [
      {
        id: 1,
        kind: 'single',
        prompt: 'Which structure gives average O(1) lookups?',
        options: [
          { id: 'a', text: 'Array scan' },
          { id: 'b', text: 'Hash map' },
        ],
      },
      {
        id: 2,
        kind: 'multiple',
        prompt: 'Which are valid hash map keys here?',
        options: [
          { id: 'a', text: 'A string' },
          { id: 'b', text: 'A number' },
          { id: 'c', text: 'A hole in the ground' },
        ],
      },
      {
        id: 3,
        kind: 'true-false',
        prompt: 'Store the number before you look up its partner.',
        options: [
          { id: 'true', text: 'True' },
          { id: 'false', text: 'False' },
        ],
      },
    ],
  };
}

export function makeQuizResult(): QuizResult {
  return {
    attempt: { score: 2, maxScore: 3, percent: 67, passed: false, createdAt: '2026-10-19T06:00:00.000Z' },
    results: [
      { questionId: 1, correct: true, correctOptionIds: ['b'], explanation: 'A hash map finds a key without scanning.' },
      { questionId: 2, correct: true, correctOptionIds: ['a', 'b'], explanation: 'Strings and numbers both hash.' },
      { questionId: 3, correct: false, correctOptionIds: ['false'], explanation: 'Look up first, store after, or an element pairs with itself.' },
    ],
    quiz: { slug: 'hashing-interview-patterns', title: 'Check your understanding', questionCount: 3, passPercent: 70, best: { percent: 67, passed: false, attempts: 1 } },
  };
}

export function makeProblemList(): ListProblemsResponse {
  return {
    problems: [
      { slug: 'two-sum', title: 'Two Sum', difficulty: 'easy', topics: ['arrays', 'hash-map'], status: 'solved', attempts: 2, lessonSlug: 'hashing-interview-patterns' },
      { slug: 'group-anagrams', title: 'Group Anagrams', difficulty: 'medium', topics: ['strings', 'hash-map'], status: 'unsolved', attempts: 0, lessonSlug: 'hashing-interview-patterns' },
    ],
    summary: {
      total: 2,
      solved: 1,
      attempted: 0,
      byDifficulty: { easy: { total: 1, solved: 1 }, medium: { total: 1, solved: 0 }, hard: { total: 0, solved: 0 } },
    },
    topics: ['arrays', 'hash-map', 'strings'],
  };
}

export const TWO_SUM_SOLUTION = `function twoSum(nums: number[], target: number): number[] {
  const seen = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const j = seen.get(target - nums[i]);
    if (j !== undefined) return [j, i];
    seen.set(nums[i], i);
  }
  return [];
}`;

export function makeProblemDetail(overrides: Partial<ProblemDetail> = {}): ProblemDetail {
  return {
    problem: {
      slug: 'two-sum',
      title: 'Two Sum',
      difficulty: 'easy',
      topics: ['arrays', 'hash-map'],
      status: 'unsolved',
      attempts: 0,
      lessonSlug: 'hashing-interview-patterns',
      statement: 'Return the **indices** of the two numbers that add up to `target`.',
      constraints: '- `2 <= nums.length <= 10^4`',
      examples: [{ input: 'nums = [2, 7, 11, 15], target = 9', output: '[0, 1]', explanation: '2 + 7 = 9.' }],
      starterCode: {
        typescript: 'function twoSum(nums: number[], target: number): number[] {\n  return [];\n}\n',
        javascript: 'function twoSum(nums, target) {\n  return [];\n}\n',
      },
      functionName: 'twoSum',
      harness: { ordering: 'any-order' },
      tests: [
        { args: [[2, 7, 11, 15], 9], expected: [0, 1] },
        { args: [[3, 2, 4], 6], expected: [1, 2] },
        { args: [[3, 3], 6], expected: [0, 1], hidden: true },
      ],
      hints: ['Which question does the inner loop ask?', 'Look up target - x in a Map.'],
      solution: {
        code: TWO_SUM_SOLUTION,
        explanation: 'Remember every value with its index and look up the partner first.',
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(n)',
      },
      videos: [],
    },
    lesson: { slug: 'hashing-interview-patterns', title: 'Hashing patterns: two-sum family, anagrams and grouping' },
    latestCode: null,
    recentAttempts: [],
    next: { slug: 'group-anagrams', title: 'Group Anagrams' },
    ...overrides,
  };
}
