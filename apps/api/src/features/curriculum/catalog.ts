import type {
  ContentStatus,
  Difficulty,
  LessonKind,
  Locale,
  ProgressStatus,
  TrackSlug,
} from '@dlos/shared';
import { eq } from 'drizzle-orm';
import type { AppContext } from '../../core/context';
import {
  courses,
  learningTracks,
  lessonProgress,
  lessons,
  lessonTranslations,
  modules,
} from '../../core/db/schema';

export interface CatalogTrack {
  id: number;
  slug: TrackSlug;
  title: string;
  shortTitle: string;
  description: string;
  icon: string;
  sortOrder: number;
}

export interface CatalogCourse {
  id: number;
  trackId: number;
  trackSlug: TrackSlug;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  difficulty: Difficulty;
  icon: string;
  tags: string[];
  outcomes: string[];
  sortOrder: number;
}

export interface CatalogModule {
  id: number;
  courseId: number;
  slug: string;
  title: string;
  description: string;
  sortOrder: number;
}

export interface CatalogLesson {
  id: number;
  moduleId: number;
  courseId: number;
  slug: string;
  title: string;
  summary: string | null;
  difficulty: Difficulty;
  kind: LessonKind;
  estimatedMinutes: number;
  contentStatus: ContentStatus;
  tags: string[];
  sortOrder: number;
  progress: ProgressStatus;
  locales: Locale[];
}

export interface Catalog {
  tracks: CatalogTrack[];
  courses: CatalogCourse[];
  modules: CatalogModule[];
  lessons: CatalogLesson[];
}

/** The whole curriculum is a few hundred rows, so it is read once per request and shaped in memory. */
export function loadCatalog(ctx: AppContext): Catalog {
  const { db } = ctx;
  const tracks = db.select().from(learningTracks).orderBy(learningTracks.sortOrder).all();
  const trackById = new Map(tracks.map((track) => [track.id, track]));

  const courseRows = db.select().from(courses).orderBy(courses.sortOrder).all();
  const moduleRows = db.select().from(modules).orderBy(modules.sortOrder).all();

  const progressByLesson = new Map(
    db
      .select({ lessonId: lessonProgress.lessonId, status: lessonProgress.status })
      .from(lessonProgress)
      .where(eq(lessonProgress.userId, ctx.userId))
      .all()
      .map((row) => [row.lessonId, row.status] as const),
  );

  const localesByLesson = new Map<number, Locale[]>();
  for (const row of db
    .select({ lessonId: lessonTranslations.lessonId, locale: lessonTranslations.locale })
    .from(lessonTranslations)
    .all()) {
    localesByLesson.set(row.lessonId, [...(localesByLesson.get(row.lessonId) ?? []), row.locale]);
  }

  const lessonRows = db.select().from(lessons).orderBy(lessons.sortOrder).all();

  return {
    tracks: tracks.map((track) => ({
      id: track.id,
      slug: track.slug,
      title: track.title,
      shortTitle: track.shortTitle,
      description: track.description,
      icon: track.icon,
      sortOrder: track.sortOrder,
    })),
    courses: courseRows.flatMap((course) => {
      const track = trackById.get(course.trackId);
      if (!track) return [];
      return [
        {
          id: course.id,
          trackId: course.trackId,
          trackSlug: track.slug,
          slug: course.slug,
          title: course.title,
          subtitle: course.subtitle,
          description: course.description,
          difficulty: course.difficulty,
          icon: course.icon,
          tags: course.tags,
          outcomes: course.outcomes,
          sortOrder: course.sortOrder,
        },
      ];
    }),
    modules: moduleRows,
    lessons: lessonRows.map((lesson) => ({
      id: lesson.id,
      moduleId: lesson.moduleId,
      courseId: lesson.courseId,
      slug: lesson.slug,
      title: lesson.title,
      summary: lesson.summary,
      difficulty: lesson.difficulty,
      kind: lesson.kind,
      estimatedMinutes: lesson.estimatedMinutes,
      contentStatus: lesson.contentStatus,
      tags: lesson.tags,
      sortOrder: lesson.sortOrder,
      progress: progressByLesson.get(lesson.id) ?? 'not_started',
      locales: localesByLesson.get(lesson.id) ?? [],
    })),
  };
}
