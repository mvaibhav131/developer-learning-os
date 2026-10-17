import { z } from 'zod';
import { MAX_ATTEMPT_CODE_LENGTH } from '../constants';
import {
  attemptKindSchema,
  attemptStatusSchema,
  harnessCodecSchema,
  harnessOrderingSchema,
  practiceLanguageSchema,
  problemDifficultySchema,
  problemStatusSchema,
  slugSchema,
  timestampSchema,
} from './common';
import { lessonRefSchema, lessonVideoSchema } from './curriculum';

const count = z.number().int().nonnegative();

export const problemSummarySchema = z.object({
  slug: slugSchema,
  title: z.string(),
  difficulty: problemDifficultySchema,
  topics: z.array(z.string()),
  status: problemStatusSchema,
  attempts: count,
  lessonSlug: slugSchema.nullable(),
});
export type ProblemSummary = z.infer<typeof problemSummarySchema>;

export const listProblemsQuerySchema = z.object({
  topic: z.string().trim().max(40).optional(),
  difficulty: problemDifficultySchema.optional(),
  status: problemStatusSchema.optional(),
  q: z.string().trim().max(80).optional(),
});

const difficultyTally = z.object({ total: count, solved: count });

export const listProblemsResponseSchema = z.object({
  problems: z.array(problemSummarySchema),
  /** Totals ignore the filters so the progress header stays stable. */
  summary: z.object({
    total: count,
    solved: count,
    attempted: count,
    byDifficulty: z.record(problemDifficultySchema, difficultyTally),
  }),
  topics: z.array(z.string()),
});
export type ListProblemsResponse = z.infer<typeof listProblemsResponseSchema>;

export const problemTestSchema = z.object({
  args: z.array(z.unknown()),
  expected: z.unknown(),
  hidden: z.boolean().optional(),
});

export const problemHarnessSchema = z.object({
  argCodecs: z.array(harnessCodecSchema).optional(),
  returnCodec: harnessCodecSchema.optional(),
  ordering: harnessOrderingSchema.optional(),
  inPlace: z.boolean().optional(),
  float: z.boolean().optional(),
});

export const problemSolutionSchema = z.object({
  code: z.string(),
  explanation: z.string(),
  timeComplexity: z.string(),
  spaceComplexity: z.string(),
});

export const attemptSchema = z.object({
  id: z.number().int(),
  language: practiceLanguageSchema,
  kind: attemptKindSchema,
  status: attemptStatusSchema,
  passedCount: count,
  totalCount: count,
  runtimeMs: count.nullable(),
  createdAt: timestampSchema,
});
export type Attempt = z.infer<typeof attemptSchema>;

export const problemDetailSchema = z.object({
  problem: problemSummarySchema.extend({
    statement: z.string(),
    constraints: z.string().nullable(),
    examples: z.array(
      z.object({ input: z.string(), output: z.string(), explanation: z.string().optional() }),
    ),
    starterCode: z.object({ typescript: z.string(), javascript: z.string() }),
    functionName: z.string(),
    harness: problemHarnessSchema,
    tests: z.array(problemTestSchema),
    hints: z.array(z.string()),
    solution: problemSolutionSchema.nullable(),
    videos: z.array(lessonVideoSchema),
  }),
  lesson: lessonRefSchema.nullable(),
  /** The most recent saved code, so the editor can pick up where the learner stopped. */
  latestCode: z
    .object({ language: practiceLanguageSchema, code: z.string(), savedAt: timestampSchema })
    .nullable(),
  recentAttempts: z.array(attemptSchema),
  next: z.object({ slug: slugSchema, title: z.string() }).nullable(),
});
export type ProblemDetail = z.infer<typeof problemDetailSchema>;

export const createAttemptSchema = z.strictObject({
  language: practiceLanguageSchema,
  kind: attemptKindSchema,
  code: z.string().min(1).max(MAX_ATTEMPT_CODE_LENGTH),
  status: attemptStatusSchema,
  passedCount: count,
  totalCount: z.number().int().min(1).max(500),
  runtimeMs: count.optional(),
});
export type CreateAttempt = z.infer<typeof createAttemptSchema>;

export const createAttemptResponseSchema = z.object({
  attempt: attemptSchema,
  problemStatus: problemStatusSchema,
  firstSolve: z.boolean(),
});
export type CreateAttemptResponse = z.infer<typeof createAttemptResponseSchema>;
