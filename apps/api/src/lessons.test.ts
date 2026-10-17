import { curriculum, loadLessonFiles, loadProblemFiles, loadVideoRegistry } from '@dlos/learning-content';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { lessons, studyPlanTasks } from './core/db/schema';
import { createTestApp, type TestApp } from './test/helpers';

const authoredFiles = loadLessonFiles();
/** A lesson that is scheduled in the 24-week roadmap (English lessons are self-paced and have no plan task). */
const [lessonFile] = authoredFiles.filter((file) => file.videoIds.length > 0 && !file.slug.startsWith('en-'));
const [englishFile] = authoredFiles.filter((file) => file.slug.startsWith('en-') && file.videoIds.length > 0);
const authored = new Set(authoredFiles.map((file) => file.slug));
const planned =
  curriculum
    .flatMap((track) => track.courses.flatMap((course) => course.modules.flatMap((module) => module.lessons)))
    .find((lesson) => !authored.has(lesson.slug))?.slug ?? 'unreachable';

let t: TestApp;
beforeEach(() => {
  t = createTestApp();
});
afterEach(() => {
  t.close();
});

function requireLesson() {
  if (!lessonFile) throw new Error('These tests need at least one authored lesson with a video.');
  return lessonFile;
}

describe('lesson content', () => {
  it('serves the written lesson, its verified videos and related practice problems', async () => {
    const file = requireLesson();
    const res = await t.request.get(`/api/v1/lessons/${file.slug}`).expect(200);

    expect(res.body.lesson).toMatchObject({ slug: file.slug, contentStatus: 'complete', progress: 'not_started', completedAt: null });
    expect(res.body.content.bodyMarkdown).toBe(file.body);
    // The default interface language is Hinglish and only English text exists, so the fallback is flagged.
    expect(res.body.content).toMatchObject({ locale: 'en', isFallback: true });

    const registry = new Map(loadVideoRegistry().map((video) => [video.id, video]));
    expect(res.body.videos.map((video: { id: string }) => video.id)).toEqual(file.videoIds);
    for (const video of res.body.videos as Array<{ id: string; title: string; embedUrl: string; watchUrl: string }>) {
      expect(video.title).toBe(registry.get(video.id)?.title);
      expect(video.embedUrl).toBe(`https://www.youtube-nocookie.com/embed/${video.id}`);
      expect(video.watchUrl).toBe(`https://www.youtube.com/watch?v=${video.id}`);
    }

    const related = loadProblemFiles().filter((problem) => problem.lesson === file.slug);
    expect(res.body.practice.map((problem: { slug: string }) => problem.slug).sort()).toEqual(
      related.map((problem) => problem.slug).sort(),
    );
    expect(res.body.practice.every((problem: { status: string }) => problem.status === 'unsolved')).toBe(true);
  });

  it('is not a fallback when the learner reads English', async () => {
    const file = requireLesson();
    await t.request.patch('/api/v1/preferences').send({ locale: 'en' }).expect(200);
    const res = await t.request.get(`/api/v1/lessons/${file.slug}`).expect(200);
    expect(res.body.content).toMatchObject({ locale: 'en', isFallback: false });
  });

  it('keeps planned lessons honest: no content, no videos, no progress', async () => {
    const res = await t.request.get(`/api/v1/lessons/${planned}`).expect(200);
    expect(res.body.content).toBeNull();
    expect(res.body.videos).toEqual([]);
    const blocked = await t.request.put(`/api/v1/lessons/${planned}/progress`).send({ status: 'completed' }).expect(409);
    expect(blocked.body.error.code).toBe('conflict');
  });

  it('completes a lesson once, ticks the linked plan task and can reopen it', async () => {
    const file = requireLesson();
    const url = `/api/v1/lessons/${file.slug}/progress`;

    const started = await t.request.put(url).send({ status: 'in_progress' }).expect(200);
    expect(started.body).toMatchObject({ slug: file.slug, status: 'in_progress', completedAt: null });
    let dashboard = await t.request.get('/api/v1/dashboard').expect(200);
    expect(dashboard.body.continueLesson).toMatchObject({ slug: file.slug, reason: 'resume' });

    const done = await t.request.put(url).send({ status: 'completed' }).expect(200);
    expect(done.body.status).toBe('completed');
    expect(done.body.completedAt).toBeTruthy();

    // Opening a finished lesson again never downgrades it.
    const reopened = await t.request.put(url).send({ status: 'in_progress' }).expect(200);
    expect(reopened.body).toMatchObject({ status: 'completed', completedAt: done.body.completedAt });

    dashboard = await t.request.get('/api/v1/dashboard').expect(200);
    expect(dashboard.body.lessons.completed).toBe(1);
    expect(dashboard.body.recentActivity.filter((event: { type: string }) => event.type === 'lesson_completed')).toHaveLength(1);
    expect(dashboard.body.continueLesson?.slug).not.toBe(file.slug);

    const linked = t.ctx.db
      .select({ completedAt: studyPlanTasks.completedAt })
      .from(studyPlanTasks)
      .innerJoin(lessons, eq(lessons.id, studyPlanTasks.lessonId))
      .where(eq(lessons.slug, file.slug))
      .all();
    expect(linked.length).toBeGreaterThan(0);
    expect(linked.every((task) => task.completedAt !== null)).toBe(true);

    const reset = await t.request.put(url).send({ status: 'not_started' }).expect(200);
    expect(reset.body).toMatchObject({ status: 'not_started', completedAt: null });
    dashboard = await t.request.get('/api/v1/dashboard').expect(200);
    expect(dashboard.body.lessons.completed).toBe(0);
    expect(dashboard.body.recentActivity.filter((event: { type: string }) => event.type === 'lesson_completed')).toHaveLength(0);
  });

  it('lets self-paced English lessons be completed without any roadmap task', async () => {
    if (!englishFile) throw new Error('These tests need at least one authored English lesson with a video.');
    const url = `/api/v1/lessons/${englishFile.slug}/progress`;

    const detail = await t.request.get(`/api/v1/lessons/${englishFile.slug}`).expect(200);
    expect(detail.body.course.trackSlug).toBe('english');
    expect(detail.body.lesson.contentStatus).toBe('complete');

    const done = await t.request.put(url).send({ status: 'completed' }).expect(200);
    expect(done.body.status).toBe('completed');

    const linked = t.ctx.db
      .select({ id: studyPlanTasks.id })
      .from(studyPlanTasks)
      .innerJoin(lessons, eq(lessons.id, studyPlanTasks.lessonId))
      .where(eq(lessons.slug, englishFile.slug))
      .all();
    expect(linked).toHaveLength(0);

    const dashboard = await t.request.get('/api/v1/dashboard').expect(200);
    expect(dashboard.body.lessons.completed).toBe(1);
  });

  it('rejects unknown lessons and invalid statuses', async () => {
    await t.request.put('/api/v1/lessons/no-such-lesson/progress').send({ status: 'completed' }).expect(404);
    await t.request.put(`/api/v1/lessons/${requireLesson().slug}/progress`).send({ status: 'finished' }).expect(400);
  });
});
