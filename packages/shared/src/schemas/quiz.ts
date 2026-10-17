import { z } from 'zod';
import { slugSchema, timestampSchema } from './common';

const count = z.number().int().nonnegative();

export const quizQuestionKindSchema = z.enum(['single', 'multiple', 'true-false']);

export const quizSummarySchema = z.object({
  /** Quizzes belong to one lesson and share its slug. */
  slug: slugSchema,
  title: z.string(),
  questionCount: count,
  passPercent: z.number().int().min(1).max(100),
  best: z
    .object({ percent: z.number().int().min(0).max(100), passed: z.boolean(), attempts: count })
    .nullable(),
});
export type QuizSummary = z.infer<typeof quizSummarySchema>;

export const quizQuestionSchema = z.object({
  id: z.number().int(),
  kind: quizQuestionKindSchema,
  prompt: z.string(),
  options: z.array(z.object({ id: z.string(), text: z.string() })),
});
export type QuizQuestion = z.infer<typeof quizQuestionSchema>;

/** Questions are sent without answers: grading happens on the server. */
export const quizDetailSchema = z.object({
  quiz: quizSummarySchema,
  questions: z.array(quizQuestionSchema),
});
export type QuizDetail = z.infer<typeof quizDetailSchema>;

export const submitQuizSchema = z.strictObject({
  /** Question id -> selected option ids. */
  answers: z.record(z.string(), z.array(z.string().max(20)).max(8)),
  durationSeconds: z.number().int().min(0).max(86_400).optional(),
});
export type SubmitQuiz = z.infer<typeof submitQuizSchema>;

export const quizResultSchema = z.object({
  attempt: z.object({
    score: count,
    maxScore: count,
    percent: z.number().int().min(0).max(100),
    passed: z.boolean(),
    createdAt: timestampSchema,
  }),
  results: z.array(
    z.object({
      questionId: z.number().int(),
      correct: z.boolean(),
      correctOptionIds: z.array(z.string()),
      explanation: z.string(),
    }),
  ),
  quiz: quizSummarySchema,
});
export type QuizResult = z.infer<typeof quizResultSchema>;
