import { z } from 'zod';
import {
  contentStatusSchema,
  difficultySchema,
  lessonKindSchema,
  localeSchema,
  problemDifficultySchema,
  problemStatusSchema,
  progressStatusSchema,
  slugSchema,
  timestampSchema,
  trackSlugSchema,
} from './common';
import { quizSummarySchema } from './quiz';

const count = z.number().int().nonnegative();

export const curriculumStatsSchema = z.object({
  moduleCount: count,
  lessonCount: count,
  completeLessonCount: count,
  estimatedMinutes: count,
  completedByUser: count,
});

export const trackSummarySchema = z.object({
  slug: trackSlugSchema,
  title: z.string(),
  shortTitle: z.string(),
  description: z.string(),
  icon: z.string(),
  sortOrder: z.number().int(),
  contentStatus: contentStatusSchema,
  courseCount: count,
  stats: curriculumStatsSchema,
});
export type TrackSummary = z.infer<typeof trackSummarySchema>;

export const courseSummarySchema = z.object({
  slug: slugSchema,
  trackSlug: trackSlugSchema,
  title: z.string(),
  subtitle: z.string(),
  description: z.string(),
  difficulty: difficultySchema,
  icon: z.string(),
  tags: z.array(z.string()),
  outcomes: z.array(z.string()),
  contentStatus: contentStatusSchema,
  stats: curriculumStatsSchema,
});
export type CourseSummary = z.infer<typeof courseSummarySchema>;

export const lessonSummarySchema = z.object({
  slug: slugSchema,
  title: z.string(),
  summary: z.string().nullable(),
  difficulty: difficultySchema,
  kind: lessonKindSchema,
  estimatedMinutes: z.number().int().positive(),
  contentStatus: contentStatusSchema,
  progress: progressStatusSchema,
  availableLocales: z.array(localeSchema),
});
export type LessonSummary = z.infer<typeof lessonSummarySchema>;

export const courseModuleSchema = z.object({
  slug: slugSchema,
  title: z.string(),
  description: z.string(),
  lessons: z.array(lessonSummarySchema),
});

export const lessonRefSchema = z.object({ slug: slugSchema, title: z.string() });
export type LessonRef = z.infer<typeof lessonRefSchema>;

export const listTracksResponseSchema = z.object({ tracks: z.array(trackSummarySchema) });
export const getTrackResponseSchema = z.object({
  track: trackSummarySchema,
  courses: z.array(courseSummarySchema),
});

export const listCoursesQuerySchema = z.object({
  track: trackSlugSchema.optional(),
  difficulty: difficultySchema.optional(),
  q: z.string().trim().max(80).optional(),
});
export const listCoursesResponseSchema = z.object({ courses: z.array(courseSummarySchema) });

export const courseDetailSchema = z.object({
  course: courseSummarySchema,
  modules: z.array(courseModuleSchema),
});
export type CourseDetail = z.infer<typeof courseDetailSchema>;

export const lessonVideoSchema = z.object({
  id: z.string().regex(/^[\w-]{11}$/),
  title: z.string(),
  author: z.string(),
  /** Spoken language of the video; Hindi covers Hindi and Hinglish. */
  language: z.union([localeSchema, z.literal('multi')]),
  watchUrl: z.url(),
  /** Privacy-enhanced embed URL (youtube-nocookie.com). */
  embedUrl: z.url(),
});
export type LessonVideo = z.infer<typeof lessonVideoSchema>;

export const lessonBodySchema = z.object({
  locale: localeSchema,
  /** True when the learner's language has no reviewed translation and English is shown instead. */
  isFallback: z.boolean(),
  title: z.string(),
  bodyMarkdown: z.string(),
});

export const lessonPracticeSchema = z.object({
  slug: slugSchema,
  title: z.string(),
  difficulty: problemDifficultySchema,
  status: problemStatusSchema,
});

export const lessonDetailSchema = z.object({
  lesson: lessonSummarySchema.extend({
    tags: z.array(z.string()),
    completedAt: timestampSchema.nullable(),
  }),
  course: z.object({ slug: slugSchema, title: z.string(), trackSlug: trackSlugSchema }),
  module: z.object({ slug: slugSchema, title: z.string() }),
  previous: lessonRefSchema.nullable(),
  next: lessonRefSchema.nullable(),
  /** Null while the lesson is only planned. */
  content: lessonBodySchema.nullable(),
  videos: z.array(lessonVideoSchema),
  practice: z.array(lessonPracticeSchema),
  quiz: quizSummarySchema.nullable(),
});
export type LessonDetail = z.infer<typeof lessonDetailSchema>;

export const setLessonProgressSchema = z.strictObject({ status: progressStatusSchema });
export const lessonProgressResponseSchema = z.object({
  slug: slugSchema,
  status: progressStatusSchema,
  completedAt: timestampSchema.nullable(),
});
export type LessonProgressResponse = z.infer<typeof lessonProgressResponseSchema>;
