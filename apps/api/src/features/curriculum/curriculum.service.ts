import type {
  ContentStatus,
  CourseDetail,
  CourseSummary,
  LessonDetail,
  LessonProgressResponse,
  LessonSummary,
  ProgressStatus,
  TrackSummary,
} from '@dlos/shared';
import { and, eq } from 'drizzle-orm';
import { nowIso, todayIn, type AppContext } from '../../core/context';
import {
  codingProblems,
  lessonProgress,
  lessons,
  lessonTranslations,
  studyPlanTasks,
} from '../../core/db/schema';
import { conflict, notFound } from '../../core/errors';
import { recordEvent, removeEvents } from '../activity/events';
import { requirePlan, updatePlanTask } from '../plan/plan.service';
import { loadProblemStats } from '../practice/practice.service';
import { getPreferences } from '../preferences/preferences.service';
import { quizSummaryForLesson } from '../quizzes/quiz.service';
import { loadCatalog, type Catalog, type CatalogCourse, type CatalogLesson, type CatalogTrack } from './catalog';
import { videosForLesson } from './videos';

type Stats = CourseSummary['stats'];

function deriveStatus(lessons: readonly CatalogLesson[]): ContentStatus {
  if (lessons.length > 0 && lessons.every((lesson) => lesson.contentStatus === 'complete')) {
    return 'complete';
  }
  return lessons.some((lesson) => lesson.contentStatus !== 'planned') ? 'in_progress' : 'planned';
}

function statsFor(lessons: readonly CatalogLesson[], moduleCount: number): Stats {
  return {
    moduleCount,
    lessonCount: lessons.length,
    completeLessonCount: lessons.filter((lesson) => lesson.contentStatus === 'complete').length,
    estimatedMinutes: lessons.reduce((sum, lesson) => sum + lesson.estimatedMinutes, 0),
    completedByUser: lessons.filter((lesson) => lesson.progress === 'completed').length,
  };
}

function lessonSummary(lesson: CatalogLesson): LessonSummary {
  return {
    slug: lesson.slug,
    title: lesson.title,
    summary: lesson.summary,
    difficulty: lesson.difficulty,
    kind: lesson.kind,
    estimatedMinutes: lesson.estimatedMinutes,
    contentStatus: lesson.contentStatus,
    progress: lesson.progress,
    availableLocales: lesson.locales,
  };
}

function courseSummary(catalog: Catalog, course: CatalogCourse): CourseSummary {
  const lessons = catalog.lessons.filter((lesson) => lesson.courseId === course.id);
  const moduleCount = catalog.modules.filter((module) => module.courseId === course.id).length;
  return {
    slug: course.slug,
    trackSlug: course.trackSlug,
    title: course.title,
    subtitle: course.subtitle,
    description: course.description,
    difficulty: course.difficulty,
    icon: course.icon,
    tags: course.tags,
    outcomes: course.outcomes,
    contentStatus: deriveStatus(lessons),
    stats: statsFor(lessons, moduleCount),
  };
}

function trackSummary(catalog: Catalog, track: CatalogTrack): TrackSummary {
  const courseIds = new Set(
    catalog.courses.filter((course) => course.trackId === track.id).map((course) => course.id),
  );
  const lessons = catalog.lessons.filter((lesson) => courseIds.has(lesson.courseId));
  const moduleCount = catalog.modules.filter((module) => courseIds.has(module.courseId)).length;
  return {
    slug: track.slug,
    title: track.title,
    shortTitle: track.shortTitle,
    description: track.description,
    icon: track.icon,
    sortOrder: track.sortOrder,
    contentStatus: deriveStatus(lessons),
    courseCount: courseIds.size,
    stats: statsFor(lessons, moduleCount),
  };
}

export function listTracks(ctx: AppContext): TrackSummary[] {
  const catalog = loadCatalog(ctx);
  return catalog.tracks.map((track) => trackSummary(catalog, track));
}

export function getTrack(
  ctx: AppContext,
  slug: string,
): { track: TrackSummary; courses: CourseSummary[] } {
  const catalog = loadCatalog(ctx);
  const track = catalog.tracks.find((candidate) => candidate.slug === slug);
  if (!track) throw notFound(`Track "${slug}"`);
  return {
    track: trackSummary(catalog, track),
    courses: catalog.courses
      .filter((course) => course.trackId === track.id)
      .map((course) => courseSummary(catalog, course)),
  };
}

export function listCourses(
  ctx: AppContext,
  filters: { track?: string | undefined; difficulty?: string | undefined; q?: string | undefined },
): CourseSummary[] {
  const catalog = loadCatalog(ctx);
  const term = filters.q?.trim().toLowerCase();
  return catalog.courses
    .filter((course) => !filters.track || course.trackSlug === filters.track)
    .filter((course) => !filters.difficulty || course.difficulty === filters.difficulty)
    .filter((course) => {
      if (!term) return true;
      const haystack = [course.title, course.subtitle, course.description, ...course.tags]
        .join(' ')
        .toLowerCase();
      return term.split(/\s+/).every((word) => haystack.includes(word));
    })
    .map((course) => courseSummary(catalog, course));
}

export function getCourse(ctx: AppContext, slug: string): CourseDetail {
  const catalog = loadCatalog(ctx);
  const course = catalog.courses.find((candidate) => candidate.slug === slug);
  if (!course) throw notFound(`Course "${slug}"`);
  return {
    course: courseSummary(catalog, course),
    modules: catalog.modules
      .filter((module) => module.courseId === course.id)
      .map((module) => ({
        slug: module.slug,
        title: module.title,
        description: module.description,
        lessons: catalog.lessons
          .filter((lesson) => lesson.moduleId === module.id)
          .map(lessonSummary),
      })),
  };
}

export function getLesson(ctx: AppContext, slug: string): LessonDetail {
  const catalog = loadCatalog(ctx);
  const lesson = catalog.lessons.find((candidate) => candidate.slug === slug);
  if (!lesson) throw notFound(`Lesson "${slug}"`);
  const course = catalog.courses.find((candidate) => candidate.id === lesson.courseId);
  const module = catalog.modules.find((candidate) => candidate.id === lesson.moduleId);
  if (!course || !module) throw notFound(`Course for lesson "${slug}"`);

  const ordered = catalog.lessons.filter((candidate) => candidate.courseId === course.id);
  const index = ordered.findIndex((candidate) => candidate.id === lesson.id);
  const previous = index > 0 ? ordered[index - 1] : undefined;
  const next = ordered[index + 1];

  const locale = getPreferences(ctx).locale;
  const translations = ctx.db
    .select()
    .from(lessonTranslations)
    .where(eq(lessonTranslations.lessonId, lesson.id))
    .all();
  const chosen = translations.find((row) => row.locale === locale) ?? translations.find((row) => row.locale === 'en');

  const progress = ctx.db
    .select({ completedAt: lessonProgress.completedAt })
    .from(lessonProgress)
    .where(and(eq(lessonProgress.userId, ctx.userId), eq(lessonProgress.lessonId, lesson.id)))
    .get();

  const stats = loadProblemStats(ctx);
  const practice = ctx.db
    .select()
    .from(codingProblems)
    .where(and(eq(codingProblems.lessonId, lesson.id), eq(codingProblems.contentStatus, 'complete')))
    .all()
    .sort((a, b) => RANK[a.difficulty] - RANK[b.difficulty] || a.title.localeCompare(b.title))
    .map((problem) => ({
      slug: problem.slug,
      title: problem.title,
      difficulty: problem.difficulty,
      status: stats.get(problem.id)?.status ?? ('unsolved' as const),
    }));

  return {
    lesson: { ...lessonSummary(lesson), tags: lesson.tags, completedAt: progress?.completedAt ?? null },
    course: { slug: course.slug, title: course.title, trackSlug: course.trackSlug },
    module: { slug: module.slug, title: module.title },
    previous: previous ? { slug: previous.slug, title: previous.title } : null,
    next: next ? { slug: next.slug, title: next.title } : null,
    content: chosen
      ? { locale: chosen.locale, isFallback: chosen.locale !== locale, title: chosen.title, bodyMarkdown: chosen.bodyMarkdown }
      : null,
    videos: videosForLesson(ctx, lesson.id),
    practice,
    quiz: quizSummaryForLesson(ctx, lesson.id),
  };
}

const RANK = { easy: 0, medium: 1, hard: 2 } as const;

/** Only lessons with written content can be started or completed; progress never comes from empty titles. */
export function setLessonProgress(ctx: AppContext, slug: string, status: ProgressStatus): LessonProgressResponse {
  const lesson = ctx.db.select().from(lessons).where(eq(lessons.slug, slug)).get();
  if (!lesson) throw notFound(`Lesson "${slug}"`);
  if (lesson.contentStatus !== 'complete') {
    throw conflict('This lesson has no written content yet, so it cannot be started or completed.');
  }

  const now = nowIso(ctx);
  const existing = ctx.db
    .select()
    .from(lessonProgress)
    .where(and(eq(lessonProgress.userId, ctx.userId), eq(lessonProgress.lessonId, lesson.id)))
    .get();
  const wasCompleted = existing?.status === 'completed';

  // Opening a finished lesson again must never downgrade it.
  const target: ProgressStatus = status === 'in_progress' && wasCompleted ? 'completed' : status;
  const completedAt = target === 'completed' ? (existing?.completedAt ?? now) : null;

  const values = {
    status: target,
    progressPercent: target === 'completed' ? 100 : target === 'in_progress' ? Math.max(existing?.progressPercent ?? 0, 10) : 0,
    startedAt: target === 'not_started' ? null : (existing?.startedAt ?? now),
    completedAt,
    lastAccessedAt: target === 'not_started' ? (existing?.lastAccessedAt ?? null) : now,
    updatedAt: now,
  };
  ctx.db
    .insert(lessonProgress)
    .values({ userId: ctx.userId, lessonId: lesson.id, ...values })
    .onConflictDoUpdate({ target: [lessonProgress.userId, lessonProgress.lessonId], set: values })
    .run();

  if (target === 'completed' && !wasCompleted) {
    recordEvent(ctx, {
      type: 'lesson_completed',
      entityType: 'lesson',
      entityId: lesson.id,
      localDate: todayIn(ctx, getPreferences(ctx).timezone),
      payload: { title: lesson.title, slug: lesson.slug },
    });
    // Finishing a lesson here also ticks it off in the study plan, so nothing is marked twice.
    const plan = requirePlan(ctx);
    const open = ctx.db
      .select({ id: studyPlanTasks.id, completedAt: studyPlanTasks.completedAt })
      .from(studyPlanTasks)
      .where(and(eq(studyPlanTasks.planId, plan.id), eq(studyPlanTasks.lessonId, lesson.id)))
      .all()
      .filter((task) => task.completedAt === null);
    for (const task of open) updatePlanTask(ctx, task.id, { completed: true });
  }
  if (target === 'not_started' && wasCompleted) removeEvents(ctx, 'lesson_completed', 'lesson', lesson.id);

  return { slug: lesson.slug, status: target, completedAt };
}
