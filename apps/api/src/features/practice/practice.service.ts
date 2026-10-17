import {
  PROBLEM_DIFFICULTIES,
  type Attempt,
  type CreateAttempt,
  type CreateAttemptResponse,
  type ListProblemsResponse,
  type ProblemDetail,
  type ProblemStatus,
  type ProblemSummary,
} from '@dlos/shared';
import { and, desc, eq, sql } from 'drizzle-orm';
import { nowIso, todayIn, type AppContext } from '../../core/context';
import { codingAttempts, codingProblems, courses, lessons } from '../../core/db/schema';
import { AppError, notFound } from '../../core/errors';
import { recordEvent } from '../activity/events';
import { videosByIds } from '../curriculum/videos';
import { getPreferences } from '../preferences/preferences.service';

type ProblemRow = typeof codingProblems.$inferSelect;
interface Stats {
  status: ProblemStatus;
  attempts: number;
}

const RANK = Object.fromEntries(PROBLEM_DIFFICULTIES.map((name, index) => [name, index])) as Record<
  ProblemRow['difficulty'],
  number
>;

const KEEP_RECENT_ATTEMPTS = 30;

export function loadProblemStats(ctx: AppContext): Map<number, Stats> {
  const rows = ctx.db
    .select({
      problemId: codingAttempts.problemId,
      attempts: sql<number>`count(*)`.mapWith(Number),
      solved: sql<number>`sum(case when ${codingAttempts.kind} = 'submit' and ${codingAttempts.status} = 'passed' then 1 else 0 end)`.mapWith(Number),
    })
    .from(codingAttempts)
    .where(eq(codingAttempts.userId, ctx.userId))
    .groupBy(codingAttempts.problemId)
    .all();
  return new Map(
    rows.map((row): [number, Stats] => [
      row.problemId,
      { status: row.solved > 0 ? 'solved' : 'attempted', attempts: row.attempts },
    ]),
  );
}

interface OrderedProblem {
  row: ProblemRow;
  lessonSlug: string | null;
}

/** Follows the curriculum: course, lesson, then easy to hard. */
function loadOrderedProblems(ctx: AppContext): OrderedProblem[] {
  return ctx.db
    .select({
      row: codingProblems,
      lessonSlug: lessons.slug,
      lessonOrder: lessons.sortOrder,
      courseOrder: courses.sortOrder,
    })
    .from(codingProblems)
    .leftJoin(lessons, eq(lessons.id, codingProblems.lessonId))
    .leftJoin(courses, eq(courses.id, lessons.courseId))
    .where(eq(codingProblems.contentStatus, 'complete'))
    .all()
    .sort(
      (a, b) =>
        (a.courseOrder ?? 1e9) - (b.courseOrder ?? 1e9) ||
        (a.lessonOrder ?? 1e9) - (b.lessonOrder ?? 1e9) ||
        RANK[a.row.difficulty] - RANK[b.row.difficulty] ||
        a.row.title.localeCompare(b.row.title),
    )
    .map(({ row, lessonSlug }) => ({ row, lessonSlug }));
}

function toSummary(item: OrderedProblem, stats: Map<number, Stats>): ProblemSummary {
  const stat = stats.get(item.row.id);
  return {
    slug: item.row.slug,
    title: item.row.title,
    difficulty: item.row.difficulty,
    topics: item.row.topics,
    status: stat?.status ?? 'unsolved',
    attempts: stat?.attempts ?? 0,
    lessonSlug: item.lessonSlug,
  };
}

export function listProblems(
  ctx: AppContext,
  filters: { topic?: string | undefined; difficulty?: string | undefined; status?: string | undefined; q?: string | undefined },
): ListProblemsResponse {
  const stats = loadProblemStats(ctx);
  const all = loadOrderedProblems(ctx).map((item) => toSummary(item, stats));

  const words = filters.q?.toLowerCase().split(/\s+/).filter(Boolean) ?? [];
  const topic = filters.topic?.toLowerCase();
  const problems = all.filter((problem) => {
    if (filters.difficulty && problem.difficulty !== filters.difficulty) return false;
    if (filters.status && problem.status !== filters.status) return false;
    if (topic && !problem.topics.some((candidate) => candidate.toLowerCase() === topic)) return false;
    const haystack = [problem.title, ...problem.topics].join(' ').toLowerCase();
    return words.every((word) => haystack.includes(word));
  });

  const byDifficulty = Object.fromEntries(
    PROBLEM_DIFFICULTIES.map((difficulty) => {
      const group = all.filter((problem) => problem.difficulty === difficulty);
      return [difficulty, { total: group.length, solved: group.filter((problem) => problem.status === 'solved').length }];
    }),
  ) as ListProblemsResponse['summary']['byDifficulty'];

  return {
    problems,
    summary: {
      total: all.length,
      solved: all.filter((problem) => problem.status === 'solved').length,
      attempted: all.filter((problem) => problem.status === 'attempted').length,
      byDifficulty,
    },
    topics: [...new Set(all.flatMap((problem) => problem.topics))].sort(),
  };
}

function toAttempt(row: typeof codingAttempts.$inferSelect): Attempt {
  return {
    id: row.id,
    language: row.language,
    kind: row.kind,
    status: row.status,
    passedCount: row.passedCount,
    totalCount: row.totalCount,
    runtimeMs: row.runtimeMs,
    createdAt: row.createdAt,
  };
}

function requireProblem(ctx: AppContext, slug: string): ProblemRow {
  const row = ctx.db.select().from(codingProblems).where(eq(codingProblems.slug, slug)).get();
  if (row?.contentStatus !== 'complete') throw notFound(`Problem "${slug}"`);
  return row;
}

export function getProblem(ctx: AppContext, slug: string): ProblemDetail {
  const row = requireProblem(ctx, slug);
  const stats = loadProblemStats(ctx);
  const ordered = loadOrderedProblems(ctx);
  const current = ordered.find((item) => item.row.id === row.id);
  const summary = toSummary(current ?? { row, lessonSlug: null }, stats);

  const lesson = row.lessonId
    ? ctx.db.select({ slug: lessons.slug, title: lessons.title }).from(lessons).where(eq(lessons.id, row.lessonId)).get()
    : undefined;

  const attempts = ctx.db
    .select()
    .from(codingAttempts)
    .where(and(eq(codingAttempts.userId, ctx.userId), eq(codingAttempts.problemId, row.id)))
    .orderBy(desc(codingAttempts.id))
    .limit(10)
    .all();
  const latest = attempts[0];

  const index = ordered.findIndex((item) => item.row.id === row.id);
  const following = [...ordered.slice(index + 1), ...ordered.slice(0, Math.max(index, 0))].find(
    (item) => (stats.get(item.row.id)?.status ?? 'unsolved') !== 'solved' && item.row.id !== row.id,
  );

  const solution = row.walkthrough?.solution;
  return {
    problem: {
      ...summary,
      statement: row.statementMarkdown,
      constraints: row.constraintsMarkdown,
      examples: row.examples,
      starterCode: row.starterCode,
      functionName: row.functionName,
      harness: row.harness,
      tests: row.testCases,
      hints: row.hints,
      solution: solution
        ? {
            code: solution.code,
            explanation: solution.explanation,
            timeComplexity: solution.timeComplexity,
            spaceComplexity: solution.spaceComplexity,
          }
        : null,
      videos: videosByIds(ctx, row.walkthrough?.videoIds ?? []),
    },
    lesson: lesson ?? null,
    latestCode: latest ? { language: latest.language, code: latest.code, savedAt: latest.createdAt } : null,
    recentAttempts: attempts.map(toAttempt),
    next: following ? { slug: following.row.slug, title: following.row.title } : null,
  };
}

export function createAttempt(ctx: AppContext, slug: string, body: CreateAttempt): CreateAttemptResponse {
  const problem = requireProblem(ctx, slug);
  const testCount = problem.testCases.length;

  if (body.passedCount > body.totalCount) {
    throw new AppError(422, 'validation_error', 'passedCount cannot be larger than totalCount.');
  }
  if (body.totalCount > testCount) {
    throw new AppError(422, 'validation_error', `This problem only has ${testCount} tests.`);
  }
  if (body.kind === 'submit' && body.totalCount !== testCount) {
    throw new AppError(422, 'validation_error', 'A submission must run every test.');
  }
  if (body.status === 'passed' && body.passedCount !== body.totalCount) {
    throw new AppError(422, 'validation_error', 'A passed attempt must pass every test it ran.');
  }

  const wasSolved = loadProblemStats(ctx).get(problem.id)?.status === 'solved';
  const now = nowIso(ctx);

  const saved = ctx.db.transaction((tx) => {
    const row = tx
      .insert(codingAttempts)
      .values({
        userId: ctx.userId,
        problemId: problem.id,
        language: body.language,
        kind: body.kind,
        code: body.code,
        status: body.status,
        passedCount: body.passedCount,
        totalCount: body.totalCount,
        runtimeMs: body.runtimeMs ?? null,
        createdAt: now,
      })
      .returning()
      .get();

    // Old failed attempts add little value; keep the latest ones and every accepted submission.
    tx.run(sql`
      delete from coding_attempts
      where user_id = ${ctx.userId} and problem_id = ${problem.id}
        and not (kind = 'submit' and status = 'passed')
        and id not in (
          select id from coding_attempts
          where user_id = ${ctx.userId} and problem_id = ${problem.id}
          order by id desc limit ${KEEP_RECENT_ATTEMPTS}
        )
    `);
    return row;
  });

  const solvedNow = body.kind === 'submit' && body.status === 'passed';
  const firstSolve = solvedNow && !wasSolved;
  if (firstSolve) {
    const timeZone = getPreferences(ctx).timezone;
    recordEvent(ctx, {
      type: 'problem_solved',
      entityType: 'problem',
      entityId: problem.id,
      localDate: todayIn(ctx, timeZone),
      payload: { title: problem.title, slug: problem.slug, trackSlug: 'dsa' },
    });
  }

  return {
    attempt: toAttempt(saved),
    problemStatus: wasSolved || solvedNow ? 'solved' : 'attempted',
    firstSolve,
  };
}
