import type { LessonVideo } from '@dlos/shared';
import { eq, inArray } from 'drizzle-orm';
import type { AppContext } from '../../core/context';
import { videoEmbedUrl, videoWatchUrl } from '../../core/db/seed/authored';
import { learningResources, lessonResources } from '../../core/db/schema';

const idOf = (resourceSlug: string): string => resourceSlug.replace(/^yt-/, '');

function toVideo(row: { slug: string; title: string; author: string; language: LessonVideo['language'] }): LessonVideo {
  const id = idOf(row.slug);
  return {
    id,
    title: row.title,
    author: row.author,
    language: row.language,
    watchUrl: videoWatchUrl(id),
    embedUrl: videoEmbedUrl(id),
  };
}

const videoColumns = {
  slug: learningResources.slug,
  title: learningResources.title,
  author: learningResources.author,
  language: learningResources.language,
};

export function videosForLesson(ctx: AppContext, lessonId: number): LessonVideo[] {
  return ctx.db
    .select(videoColumns)
    .from(lessonResources)
    .innerJoin(learningResources, eq(learningResources.id, lessonResources.resourceId))
    .where(eq(lessonResources.lessonId, lessonId))
    .orderBy(lessonResources.sortOrder)
    .all()
    .map(toVideo);
}

/** Keeps the order of `ids` and skips ids that are not registered. */
export function videosByIds(ctx: AppContext, ids: readonly string[]): LessonVideo[] {
  if (ids.length === 0) return [];
  const rows = new Map(
    ctx.db
      .select(videoColumns)
      .from(learningResources)
      .where(inArray(learningResources.slug, ids.map((id) => `yt-${id}`)))
      .all()
      .map((row) => [idOf(row.slug), row] as const),
  );
  return ids.flatMap((id) => {
    const row = rows.get(id);
    return row ? [toVideo(row)] : [];
  });
}
