import {
  loadLessonFiles,
  loadProblemFiles,
  loadQuizFiles,
  loadVideoRegistry,
  type ProblemFile,
} from '@dlos/learning-content';
import { and, eq, notInArray, sql } from 'drizzle-orm';
import type { Db } from '../client';
import {
  codingProblems,
  learningResources,
  lessonResources,
  lessons,
  lessonTranslations,
  quizQuestions,
  quizzes,
  type ProblemHarness,
} from '../schema';

type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

export const videoResourceSlug = (id: string): string => `yt-${id}`;
export const videoEmbedUrl = (id: string): string => `https://www.youtube-nocookie.com/embed/${id}`;
export const videoWatchUrl = (id: string): string => `https://www.youtube.com/watch?v=${id}`;

function harnessOf(problem: ProblemFile): ProblemHarness {
  const harness: ProblemHarness = {};
  if (problem.args) harness.argCodecs = problem.args;
  if (problem.returns) harness.returnCodec = problem.returns;
  if (problem.ordering) harness.ordering = problem.ordering;
  if (problem.inPlace) harness.inPlace = true;
  if (problem.float) harness.float = true;
  return harness;
}

/** Lesson bodies, verified videos and coding problems that live as files in learning-content. */
export function seedAuthoredContent(tx: Tx, now: string): { lessonBodies: number; problems: number } {
  const lessonIds = new Map(
    tx.select({ id: lessons.id, slug: lessons.slug, title: lessons.title }).from(lessons).all().map((row) => [row.slug, row] as const),
  );

  // --- videos ---------------------------------------------------------------------------------
  const registry = loadVideoRegistry();
  for (const video of registry) {
    const values = {
      slug: videoResourceSlug(video.id),
      title: video.title,
      author: video.author,
      url: videoWatchUrl(video.id),
      language: video.language,
      resourceType: 'video' as const,
      cost: 'free' as const,
      license: 'Embedded with the official YouTube player; owned by the channel',
      difficulty: 'intermediate' as const,
      topics: video.topics,
      trackSlug: null,
      durationMinutes: null,
      embeddable: true,
      embedUrl: videoEmbedUrl(video.id),
      verificationStatus: 'verified' as const,
      lastCheckedAt: video.verifiedAt ? `${video.verifiedAt}T00:00:00.000Z` : null,
      createdAt: now,
      updatedAt: now,
    };
    const { createdAt: _created, ...updatable } = values;
    tx.insert(learningResources)
      .values(values)
      .onConflictDoUpdate({ target: learningResources.slug, set: updatable })
      .run();
  }
  const resourceIds = new Map(
    tx
      .select({ id: learningResources.id, slug: learningResources.slug })
      .from(learningResources)
      .all()
      .map((row) => [row.slug, row.id] as const),
  );

  // --- lesson bodies and their videos ---------------------------------------------------------
  tx.delete(lessonResources).run();
  const files = loadLessonFiles();
  const authoredIds: number[] = [];
  for (const file of files) {
    const lesson = lessonIds.get(file.slug);
    if (!lesson) throw new Error(`Lesson file "${file.slug}.md" has no matching lesson in the curriculum.`);
    authoredIds.push(lesson.id);

    const previous = tx
      .select({ hash: lessonTranslations.contentHash })
      .from(lessonTranslations)
      .where(and(eq(lessonTranslations.lessonId, lesson.id), eq(lessonTranslations.locale, 'en')))
      .get();

    tx.insert(lessonTranslations)
      .values({
        lessonId: lesson.id,
        locale: 'en',
        title: lesson.title,
        summary: file.summary,
        bodyMarkdown: file.body,
        reviewStatus: 'reviewed',
        contentHash: file.hash,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [lessonTranslations.lessonId, lessonTranslations.locale],
        set: {
          title: lesson.title,
          summary: file.summary,
          bodyMarkdown: file.body,
          reviewStatus: 'reviewed',
          contentHash: file.hash,
          updatedAt: now,
        },
      })
      .run();

    const unchanged = previous?.hash === file.hash;
    tx.update(lessons)
      .set({
        contentStatus: 'complete',
        summary: file.summary,
        tags: file.tags,
        ...(file.minutes ? { estimatedMinutes: file.minutes } : {}),
        ...(unchanged ? {} : { contentVersion: sql`${lessons.contentVersion} + 1` }),
        updatedAt: now,
      })
      .where(eq(lessons.id, lesson.id))
      .run();

    file.videoIds.forEach((videoId, index) => {
      const resourceId = resourceIds.get(videoResourceSlug(videoId));
      if (resourceId === undefined) throw new Error(`Lesson "${file.slug}" uses unregistered video ${videoId}.`);
      tx.insert(lessonResources)
        .values({ lessonId: lesson.id, resourceId, role: index === 0 ? 'primary-video' : 'video', sortOrder: index })
        .run();
    });
  }

  if (authoredIds.length > 0) {
    tx.delete(lessonTranslations)
      .where(and(eq(lessonTranslations.locale, 'en'), notInArray(lessonTranslations.lessonId, authoredIds)))
      .run();
  } else {
    tx.delete(lessonTranslations).where(eq(lessonTranslations.locale, 'en')).run();
  }

  // --- quizzes ----------------------------------------------------------------------------------
  const quizFiles = loadQuizFiles();
  for (const quiz of quizFiles) {
    const lesson = lessonIds.get(quiz.slug);
    if (!lesson) throw new Error(`Quiz "${quiz.slug}.yaml" has no matching lesson in the curriculum.`);
    const row = tx
      .insert(quizzes)
      .values({ slug: quiz.slug, lessonId: lesson.id, title: quiz.title, passPercent: quiz.passPercent, createdAt: now, updatedAt: now })
      .onConflictDoUpdate({
        target: quizzes.slug,
        set: { lessonId: lesson.id, title: quiz.title, passPercent: quiz.passPercent, updatedAt: now },
      })
      .returning({ id: quizzes.id })
      .get();
    if (!row) throw new Error(`Could not save quiz "${quiz.slug}".`);

    // Update in place so question ids stay stable between restarts.
    const existing = tx.select().from(quizQuestions).where(eq(quizQuestions.quizId, row.id)).orderBy(quizQuestions.sortOrder).all();
    quiz.questions.forEach((question, index) => {
      const values = {
        quizId: row.id,
        kind: question.kind,
        prompt: question.prompt,
        options: question.options,
        correctOptionIds: question.correctOptionIds,
        explanation: question.explanation,
        sortOrder: index + 1,
      };
      const current = existing[index];
      if (current) tx.update(quizQuestions).set(values).where(eq(quizQuestions.id, current.id)).run();
      else tx.insert(quizQuestions).values(values).run();
    });
    for (const extra of existing.slice(quiz.questions.length)) {
      tx.delete(quizQuestions).where(eq(quizQuestions.id, extra.id)).run();
    }
  }
  if (quizFiles.length > 0) {
    tx.delete(quizzes).where(notInArray(quizzes.slug, quizFiles.map((quiz) => quiz.slug))).run();
  } else {
    tx.delete(quizzes).run();
  }

  // --- coding problems --------------------------------------------------------------------------
  const problems = loadProblemFiles();
  for (const problem of problems) {
    const lessonId = problem.lesson ? (lessonIds.get(problem.lesson)?.id ?? null) : null;
    const values = {
      slug: problem.slug,
      lessonId,
      title: problem.title,
      difficulty: problem.difficulty,
      topics: problem.topics,
      statementMarkdown: problem.statement,
      constraintsMarkdown: problem.constraints ?? null,
      examples: problem.examples,
      starterCode: { javascript: problem.starterJavaScript, typescript: problem.starter },
      functionName: problem.function,
      harness: harnessOf(problem),
      testCases: problem.tests.map((test) => ({
        args: test.args,
        expected: test.expected,
        ...(test.hidden ? { hidden: true } : {}),
      })),
      hints: problem.hints,
      walkthrough: {
        solution: {
          code: problem.solution.code,
          explanation: problem.solution.explanation,
          timeComplexity: problem.solution.time,
          spaceComplexity: problem.solution.space,
        },
        videoIds: problem.videos,
      },
      source: 'original' as const,
      externalUrl: null,
      license: 'Original work for this project',
      contentStatus: 'complete' as const,
      createdAt: now,
      updatedAt: now,
    };
    const { createdAt: _createdAt, ...updatableProblem } = values;
    tx.insert(codingProblems)
      .values(values)
      .onConflictDoUpdate({ target: codingProblems.slug, set: updatableProblem })
      .run();
  }
  const slugs = problems.map((problem) => problem.slug);
  if (slugs.length > 0) {
    tx.update(codingProblems)
      .set({ contentStatus: 'planned' })
      .where(notInArray(codingProblems.slug, slugs))
      .run();
  }

  return { lessonBodies: files.length, problems: problems.length };
}
