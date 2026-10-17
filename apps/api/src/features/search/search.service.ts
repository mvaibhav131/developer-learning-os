import type { SearchResponse, SearchResult, TrackSlug } from '@dlos/shared';
import type { AppContext } from '../../core/context';
import { codingProblems, projects } from '../../core/db/schema';
import { eq } from 'drizzle-orm';
import { loadCatalog } from '../curriculum/catalog';

interface Candidate {
  type: SearchResult['type'];
  slug: string;
  title: string;
  subtitle: string | null;
  trackSlug: TrackSlug | null;
  fields: string[];
  base: number;
}

export function scoreMatch(words: readonly string[], title: string, fields: readonly string[]): number {
  const loweredTitle = title.toLowerCase();
  const haystack = [title, ...fields].join(' ').toLowerCase();
  if (!words.every((word) => haystack.includes(word))) return 0;

  const phrase = words.join(' ');
  let score = 10;
  if (loweredTitle === phrase) score += 100;
  else if (loweredTitle.startsWith(phrase)) score += 70;
  else if (loweredTitle.includes(phrase)) score += 50;
  if (words.every((word) => loweredTitle.includes(word))) score += 20;
  return score;
}

export function searchCatalog(ctx: AppContext, query: string, limit: number): SearchResponse {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const catalog = loadCatalog(ctx);
  const courseById = new Map(catalog.courses.map((course) => [course.id, course]));

  const candidates: Candidate[] = [
    ...catalog.tracks.map((track) => ({
      type: 'track' as const,
      slug: track.slug,
      title: track.title,
      subtitle: track.shortTitle,
      trackSlug: track.slug,
      fields: [track.description],
      base: 5,
    })),
    ...catalog.courses.map((course) => ({
      type: 'course' as const,
      slug: course.slug,
      title: course.title,
      subtitle: course.subtitle,
      trackSlug: course.trackSlug,
      fields: [course.subtitle, course.description, ...course.tags],
      base: 3,
    })),
    ...catalog.lessons.map((lesson) => {
      const course = courseById.get(lesson.courseId);
      return {
        type: 'lesson' as const,
        slug: lesson.slug,
        title: lesson.title,
        subtitle: course?.title ?? null,
        trackSlug: course?.trackSlug ?? null,
        fields: [...lesson.tags, lesson.summary ?? ''],
        base: 1,
      };
    }),
    ...ctx.db
      .select({
        slug: projects.slug,
        title: projects.title,
        goal: projects.goal,
        summary: projects.summary,
      })
      .from(projects)
      .all()
      .map((project) => ({
        type: 'project' as const,
        slug: project.slug,
        title: project.title,
        subtitle: project.goal,
        trackSlug: 'ai' as const,
        fields: [project.goal, project.summary],
        base: 2,
      })),
    ...ctx.db
      .select({ slug: codingProblems.slug, title: codingProblems.title, topics: codingProblems.topics })
      .from(codingProblems)
      .where(eq(codingProblems.contentStatus, 'complete'))
      .all()
      .map((problem) => ({
        type: 'problem' as const,
        slug: problem.slug,
        title: problem.title,
        subtitle: problem.topics.join(', '),
        trackSlug: 'dsa' as const,
        fields: problem.topics,
        base: 2,
      })),
  ];

  const results = candidates
    .map((candidate) => ({
      candidate,
      score: scoreMatch(words, candidate.title, candidate.fields),
    }))
    .filter(({ score }) => score > 0)
    .map(({ candidate, score }) => ({
      type: candidate.type,
      slug: candidate.slug,
      title: candidate.title,
      subtitle: candidate.subtitle,
      trackSlug: candidate.trackSlug,
      score: score + candidate.base,
    }))
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));

  return { query, total: results.length, results: results.slice(0, limit) };
}
