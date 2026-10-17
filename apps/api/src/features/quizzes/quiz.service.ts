import type { QuizDetail, QuizResult, QuizSummary, SubmitQuiz } from '@dlos/shared';
import { and, asc, eq } from 'drizzle-orm';
import { nowIso, type AppContext } from '../../core/context';
import { quizAttempts, quizQuestions, quizzes } from '../../core/db/schema';
import { AppError, notFound } from '../../core/errors';

type QuizRow = typeof quizzes.$inferSelect;

function summarise(ctx: AppContext, quiz: QuizRow): QuizSummary {
  const questionCount = ctx.db.select({ id: quizQuestions.id }).from(quizQuestions).where(eq(quizQuestions.quizId, quiz.id)).all().length;
  const attempts = ctx.db
    .select({ score: quizAttempts.score, maxScore: quizAttempts.maxScore, passed: quizAttempts.passed })
    .from(quizAttempts)
    .where(and(eq(quizAttempts.userId, ctx.userId), eq(quizAttempts.quizId, quiz.id)))
    .all();
  const best =
    attempts.length === 0
      ? null
      : {
          percent: Math.max(...attempts.map((attempt) => Math.round((attempt.score / Math.max(attempt.maxScore, 1)) * 100))),
          passed: attempts.some((attempt) => attempt.passed),
          attempts: attempts.length,
        };
  return { slug: quiz.slug, title: quiz.title, questionCount, passPercent: quiz.passPercent, best };
}

export function quizSummaryForLesson(ctx: AppContext, lessonId: number): QuizSummary | null {
  const quiz = ctx.db.select().from(quizzes).where(eq(quizzes.lessonId, lessonId)).get();
  return quiz ? summarise(ctx, quiz) : null;
}

function requireQuiz(ctx: AppContext, slug: string): QuizRow {
  const quiz = ctx.db.select().from(quizzes).where(eq(quizzes.slug, slug)).get();
  if (!quiz) throw notFound(`Quiz "${slug}"`);
  return quiz;
}

export function getQuiz(ctx: AppContext, slug: string): QuizDetail {
  const quiz = requireQuiz(ctx, slug);
  const questions = ctx.db
    .select()
    .from(quizQuestions)
    .where(eq(quizQuestions.quizId, quiz.id))
    .orderBy(asc(quizQuestions.sortOrder))
    .all()
    .map((question) => ({ id: question.id, kind: question.kind, prompt: question.prompt, options: question.options }));
  return { quiz: summarise(ctx, quiz), questions };
}

const sameSet = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && a.every((value) => b.includes(value));

export function submitQuiz(ctx: AppContext, slug: string, body: SubmitQuiz): QuizResult {
  const quiz = requireQuiz(ctx, slug);
  const questions = ctx.db.select().from(quizQuestions).where(eq(quizQuestions.quizId, quiz.id)).orderBy(asc(quizQuestions.sortOrder)).all();
  const knownIds = new Set(questions.map((question) => String(question.id)));

  for (const [questionId, picked] of Object.entries(body.answers)) {
    const question = questions.find((candidate) => String(candidate.id) === questionId);
    if (!question || !knownIds.has(questionId)) throw new AppError(422, 'validation_error', `Unknown question "${questionId}".`);
    const valid = new Set(question.options.map((option) => option.id));
    if (picked.some((id) => !valid.has(id))) throw new AppError(422, 'validation_error', `Unknown option for question ${questionId}.`);
    if (question.kind !== 'multiple' && picked.length > 1) {
      throw new AppError(422, 'validation_error', `Question ${questionId} accepts one answer.`);
    }
  }

  const results = questions.map((question) => {
    const picked = body.answers[String(question.id)] ?? [];
    return {
      questionId: question.id,
      correct: sameSet([...new Set(picked)], question.correctOptionIds),
      correctOptionIds: question.correctOptionIds,
      explanation: question.explanation,
    };
  });
  const score = results.filter((result) => result.correct).length;
  const maxScore = questions.length;
  const percent = Math.round((score / Math.max(maxScore, 1)) * 100);
  const passed = percent >= quiz.passPercent;
  const createdAt = nowIso(ctx);

  ctx.db
    .insert(quizAttempts)
    .values({
      userId: ctx.userId,
      quizId: quiz.id,
      score,
      maxScore,
      passed,
      answers: body.answers,
      durationSeconds: body.durationSeconds ?? null,
      createdAt,
    })
    .run();

  return { attempt: { score, maxScore, percent, passed, createdAt }, results, quiz: summarise(ctx, quiz) };
}
