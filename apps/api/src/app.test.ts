import { endpoints } from '@dlos/shared';
import { curriculum, loadLessonFiles, loadProblemFiles } from '@dlos/learning-content';
import { count } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { lessons, studyPlans } from './core/db/schema';
import { seedAll } from './core/db/seed';
import { DEFAULT_TODAY, createTestApp, type TestApp } from './test/helpers';

const authoredSlugs = new Set(loadLessonFiles().map((file) => file.slug));
const allLessons = curriculum.flatMap((track) =>
  track.courses.flatMap((course) => course.modules.flatMap((module) => module.lessons)),
);
const courseCount = curriculum.reduce((sum, track) => sum + track.courses.length, 0);

let t: TestApp;
beforeEach(() => {
  t = createTestApp();
});
afterEach(() => {
  t.close();
});

describe('system', () => {
  it('reports health, migrations, seeded content and the AI status honestly', async () => {
    const res = await t.request.get('/api/v1/health').expect(200);
    expect(res.body).toMatchObject({
      status: 'ok',
      database: { status: 'ok' },
      content: {
        tracks: curriculum.length,
        courses: courseCount,
        lessons: allLessons.length,
        lessonsWithContent: authoredSlugs.size,
      },
      ai: { provider: 'none', status: 'not_configured' },
    });
    expect(res.body.database.appliedMigrations).toBeGreaterThan(0);
  });

  it('serves an OpenAPI document that covers every endpoint contract', async () => {
    const res = await t.request.get('/api/openapi.json').expect(200);
    const operations = Object.values(res.body.paths as Record<string, object>).flatMap((item) =>
      Object.keys(item),
    );
    expect(operations).toHaveLength(endpoints.length);
    expect(res.body.paths['/api/v1/plan/tasks/{id}']).toHaveProperty('patch');
  });

  it('answers unknown routes with a JSON 404', async () => {
    const res = await t.request.get('/api/v1/nope').expect(404);
    expect(res.body.error).toMatchObject({ code: 'not_found' });
  });

  it('seeding twice neither duplicates content nor recreates the plan', () => {
    const countLessons = () => t.ctx.db.select({ n: count() }).from(lessons).get()?.n;
    const countPlans = () => t.ctx.db.select({ n: count() }).from(studyPlans).get()?.n;
    const lessonsBefore = countLessons();
    const plansBefore = countPlans();

    const again = seedAll(t.ctx.db, { config: t.ctx.config, clock: t.clock });

    expect(lessonsBefore).toBe(allLessons.length);
    expect(countLessons()).toBe(lessonsBefore);
    expect(countPlans()).toBe(plansBefore);
    expect(again.planCreated).toBe(false);
    expect(again.userId).toBe(t.ctx.userId);
  });
});

describe('security', () => {
  it('rejects state changes from an unknown browser origin', async () => {
    const res = await t.request
      .patch('/api/v1/preferences')
      .set('Origin', 'https://evil.example')
      .send({ theme: 'dark' })
      .expect(403);
    expect(res.body.error.code).toBe('forbidden_origin');
  });

  it('allows state changes from the configured web origin', async () => {
    await t.request
      .patch('/api/v1/preferences')
      .set('Origin', 'http://localhost:5173')
      .send({ theme: 'dark' })
      .expect(200);
  });

  it('rejects unexpected Host headers', async () => {
    const res = await t.request.get('/api/v1/health').set('Host', 'evil.example').expect(403);
    expect(res.body.error.code).toBe('invalid_host');
  });

  it('rejects non-JSON bodies and malformed JSON', async () => {
    const wrongType = await t.request
      .patch('/api/v1/preferences')
      .set('Content-Type', 'text/plain')
      .send('theme=dark')
      .expect(415);
    expect(wrongType.body.error.code).toBe('unsupported_media_type');

    const malformed = await t.request
      .patch('/api/v1/preferences')
      .set('Content-Type', 'application/json')
      .send('{"theme":')
      .expect(400);
    expect(malformed.body.error.code).toBe('invalid_json');
  });

  it('rejects oversized bodies', async () => {
    const res = await t.request
      .post('/api/v1/study-sessions')
      .send({ trackSlug: 'ai', durationMinutes: 30, note: 'x'.repeat(200_000) })
      .expect(413);
    expect(res.body.error.code).toBe('payload_too_large');
  });

  it('sets standard security headers', async () => {
    const res = await t.request.get('/api/v1/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-request-id']).toBeTruthy();
  });
});

describe('curriculum', () => {
  it('lists the tracks with honest content stats', async () => {
    const res = await t.request.get('/api/v1/tracks').expect(200);
    expect(res.body.tracks.map((track: { slug: string }) => track.slug)).toEqual([
      'ai',
      'dsa',
      'system-design',
      'full-stack',
      'interview',
      'english',
    ]);
    const ai = res.body.tracks[0];
    expect(ai.courseCount).toBe(6);
    expect(ai.stats.lessonCount).toBe(97);
    const aiAuthored = curriculum[0]!.courses
      .flatMap((course) => course.modules.flatMap((module) => module.lessons))
      .filter((lesson) => authoredSlugs.has(lesson.slug)).length;
    expect(ai.stats.completeLessonCount).toBe(aiAuthored);
    expect(ai.contentStatus).toBe(aiAuthored === 0 ? 'planned' : 'in_progress');
  });

  it('returns a track with its courses and 404s for unknown slugs', async () => {
    const res = await t.request.get('/api/v1/tracks/dsa').expect(200);
    expect(res.body.courses).toHaveLength(4);
    await t.request.get('/api/v1/tracks/unknown').expect(404);
  });

  it('filters the course catalog', async () => {
    const byTrack = await t.request.get('/api/v1/courses?track=system-design').expect(200);
    expect(byTrack.body.courses).toHaveLength(3);

    const byDifficulty = await t.request
      .get('/api/v1/courses?track=ai&difficulty=advanced')
      .expect(200);
    expect(byDifficulty.body.courses.map((c: { slug: string }) => c.slug)).toEqual([
      'langgraph-agents',
      'production-ai',
    ]);

    const byText = await t.request.get('/api/v1/courses?q=vector').expect(200);
    expect(byText.body.courses.map((c: { slug: string }) => c.slug)).toContain('rag-mastery');
  });

  it('validates query parameters', async () => {
    const res = await t.request.get('/api/v1/courses?difficulty=expert').expect(400);
    expect(res.body.error.code).toBe('validation_error');
  });

  it('returns a course with modules and lessons', async () => {
    const res = await t.request.get('/api/v1/courses/rag-mastery').expect(200);
    expect(res.body.modules).toHaveLength(4);
    expect(res.body.course.stats.lessonCount).toBe(23);
    expect(res.body.modules[0].lessons[0]).toMatchObject({
      slug: 'why-rag-exists',
      contentStatus: authoredSlugs.has('why-rag-exists') ? 'complete' : 'planned',
      progress: 'not_started',
      availableLocales: authoredSlugs.has('why-rag-exists') ? ['en'] : [],
    });
  });

  it('returns lesson metadata with previous and next lessons', async () => {
    const res = await t.request.get('/api/v1/lessons/rag-vs-fine-tuning').expect(200);
    expect(res.body.previous.slug).toBe('why-rag-exists');
    expect(res.body.next.slug).toBe('rag-pipeline-overview');
    expect(res.body.course.slug).toBe('rag-mastery');

    const first = await t.request.get('/api/v1/lessons/what-is-ai').expect(200);
    expect(first.body.previous).toBeNull();
    await t.request.get('/api/v1/lessons/not-a-lesson').expect(404);
  });
});

describe('preferences', () => {
  it('starts with Hinglish and the 60/30/30 daily routine', async () => {
    const res = await t.request.get('/api/v1/preferences').expect(200);
    expect(res.body).toMatchObject({
      locale: 'hi-Latn',
      theme: 'system',
      timezone: 'Asia/Kolkata',
      dailyGoals: { ai: 60, dsa: 30, 'system-design': 30, 'full-stack': 0, interview: 0, english: 0 },
    });
  });

  it('persists partial updates and merges daily goals', async () => {
    const res = await t.request
      .patch('/api/v1/preferences')
      .send({ locale: 'hi', displayName: 'Vaibhav', dailyGoals: { dsa: 45 } })
      .expect(200);
    expect(res.body).toMatchObject({
      locale: 'hi',
      displayName: 'Vaibhav',
      dailyGoals: { ai: 60, dsa: 45, 'system-design': 30 },
    });
    const again = await t.request.get('/api/v1/preferences').expect(200);
    expect(again.body.locale).toBe('hi');
  });

  it('rejects invalid values and unknown fields', async () => {
    await t.request.patch('/api/v1/preferences').send({ locale: 'fr' }).expect(400);
    await t.request.patch('/api/v1/preferences').send({ timezone: 'Mars/Base' }).expect(400);
    await t.request.patch('/api/v1/preferences').send({ dailyGoals: { ai: 9999 } }).expect(400);
    const extra = await t.request.patch('/api/v1/preferences').send({ role: 'admin' }).expect(400);
    expect(extra.body.error.code).toBe('validation_error');
  });
});

describe('plan', () => {
  it('builds the full 24-week plan starting today', async () => {
    const res = await t.request.get('/api/v1/plan').expect(200);
    expect(res.body).toMatchObject({
      state: 'active',
      currentWeek: 1,
      today: DEFAULT_TODAY,
      plan: { startDate: DEFAULT_TODAY, weekCount: 24 },
      totals: { tasks: 458, coreTasks: 360, completed: 0 },
    });
    expect(res.body.weeks).toHaveLength(24);
    expect(res.body.phases.map((p: { key: string }) => p.key)).toEqual([
      'foundations',
      'building-blocks',
      'applications',
      'advanced-systems',
      'production',
      'capstone',
    ]);
  });

  it('returns a week grouped by day with 120 core minutes per study day', async () => {
    const res = await t.request.get('/api/v1/plan/weeks/1').expect(200);
    expect(res.body.days).toHaveLength(7);
    for (const day of res.body.days.slice(0, 5)) {
      const minutes = day.tasks.reduce((sum: number, task: { plannedMinutes: number }) => sum + task.plannedMinutes, 0);
      expect(minutes).toBe(120);
    }
    const monday = res.body.days[0].tasks;
    expect(monday.map((task: { trackSlug: string }) => task.trackSlug)).toEqual([
      'ai',
      'dsa',
      'system-design',
    ]);
    expect(monday[0].lesson).toMatchObject({ slug: 'what-is-ai', contentStatus: 'planned' });
    await t.request.get('/api/v1/plan/weeks/25').expect(400);
  });

  it('completes and reopens tasks, recording and removing the activity event', async () => {
    const week = await t.request.get('/api/v1/plan/weeks/1').expect(200);
    const taskId: number = week.body.days[0].tasks[0].id;

    const done = await t.request
      .patch(`/api/v1/plan/tasks/${taskId}`)
      .send({ completed: true })
      .expect(200);
    expect(done.body.completedAt).toBeTruthy();

    let dashboard = await t.request.get('/api/v1/dashboard').expect(200);
    expect(dashboard.body.plan.overall.coreCompleted).toBe(1);
    expect(dashboard.body.recentActivity[0]).toMatchObject({
      type: 'task_completed',
      trackSlug: 'ai',
    });
    expect(
      dashboard.body.achievements.find((a: { key: string }) => a.key === 'first-task').unlocked,
    ).toBe(true);

    await t.request.patch(`/api/v1/plan/tasks/${taskId}`).send({ completed: false }).expect(200);
    dashboard = await t.request.get('/api/v1/dashboard').expect(200);
    expect(dashboard.body.plan.overall.coreCompleted).toBe(0);
    expect(dashboard.body.recentActivity).toHaveLength(0);
  });

  it('supports custom tasks: create, reschedule, validate and delete', async () => {
    const created = await t.request
      .post('/api/v1/plan/tasks')
      .send({
        weekNumber: 2,
        dayOffset: 3,
        trackSlug: 'dsa',
        title: 'Extra graph practice',
        plannedMinutes: 45,
      })
      .expect(201);
    expect(created.body).toMatchObject({
      isCustom: true,
      kind: 'practice',
      isOptional: false,
      scheduledDate: '2026-10-29',
    });

    const moved = await t.request
      .patch(`/api/v1/plan/tasks/${created.body.id}`)
      .send({ scheduledDate: '2026-10-20', title: 'Graph practice (moved)' })
      .expect(200);
    expect(moved.body).toMatchObject({ weekNumber: 1, dayOffset: 1, title: 'Graph practice (moved)' });

    const outside = await t.request
      .patch(`/api/v1/plan/tasks/${created.body.id}`)
      .send({ scheduledDate: '2030-01-01' })
      .expect(400);
    expect(outside.body.error.message).toContain('inside the plan');

    await t.request.delete(`/api/v1/plan/tasks/${created.body.id}`).expect(204);
    await t.request.delete(`/api/v1/plan/tasks/${created.body.id}`).expect(404);
    await t.request
      .post('/api/v1/plan/tasks')
      .send({ weekNumber: 30, dayOffset: 0, trackSlug: 'ai', title: 'x', plannedMinutes: 30 })
      .expect(400);
  });

  it('moves the start date and reports an upcoming plan', async () => {
    const res = await t.request
      .patch('/api/v1/plan')
      .send({ startDate: '2026-10-26', name: 'My plan' })
      .expect(200);
    expect(res.body).toMatchObject({
      state: 'upcoming',
      currentWeek: null,
      daysUntilStart: 7,
      plan: { name: 'My plan', startDate: '2026-10-26', endDate: '2027-04-11' },
    });
  });

  it('resets only with explicit confirmation and discards progress', async () => {
    const week = await t.request.get('/api/v1/plan/weeks/1').expect(200);
    await t.request
      .patch(`/api/v1/plan/tasks/${week.body.days[0].tasks[0].id}`)
      .send({ completed: true })
      .expect(200);

    await t.request.post('/api/v1/plan/reset').send({}).expect(400);
    const res = await t.request.post('/api/v1/plan/reset').send({ confirm: true }).expect(200);
    expect(res.body.totals).toMatchObject({ tasks: 458, completed: 0 });
  });
});

describe('study sessions and the dashboard', () => {
  it('shows an honest, empty-but-planned dashboard for a new learner', async () => {
    const res = await t.request.get('/api/v1/dashboard').expect(200);
    const d = res.body;
    expect(d.today).toBe(DEFAULT_TODAY);
    expect(d.plan).toMatchObject({
      state: 'active',
      currentWeek: 1,
      overall: { coreTasks: 360, coreCompleted: 0, percent: 0 },
    });
    expect(d.plan.week.title).toContain('Foundations');
    expect(d.todayTasks.map((task: { trackSlug: string }) => task.trackSlug)).toEqual([
      'ai',
      'dsa',
      'system-design',
    ]);
    expect(d.nextUp.title).toBe('What is AI?');
    expect(d.daily).toMatchObject({ targetMinutes: 120, studiedMinutes: 0, percent: 0 });
    expect(d.weekly).toMatchObject({ weekStart: DEFAULT_TODAY, totalMinutes: 0, targetMinutes: 600 });
    expect(d.streak).toMatchObject({ current: 0, longest: 0 });
    expect(d.lessons).toMatchObject({ completed: 0, catalogTotal: allLessons.length, authoredTotal: authoredSlugs.size });
    expect(d.practice).toEqual({ total: loadProblemFiles().length, solved: 0, attempted: 0 });
    expect(d.continueLesson).toMatchObject({ reason: 'start' });
    expect(authoredSlugs.has(d.continueLesson.slug)).toBe(true);
    expect(d.reviews).toEqual({ dueToday: 0, upcoming: [] });
    expect(d.projects).toMatchObject({ total: 10, started: 0, milestonesTotal: 50 });
    expect(d.readiness.percent).toBe(0);
    // Plan progress, lesson progress and practice all exist now; interviews do not.
    expect(d.readiness.signals.filter((s: { percent: number | null }) => s.percent !== null)).toHaveLength(3);
    expect(d.recentActivity).toEqual([]);
    expect(d.achievements.every((a: { unlocked: boolean }) => !a.unlocked)).toBe(true);
    expect(d.focusAreas).toEqual([]);
  });

  it('turns logged sessions into daily progress, weekly hours and a streak', async () => {
    await t.request
      .post('/api/v1/study-sessions')
      .send({ trackSlug: 'ai', durationMinutes: 60, source: 'timer' })
      .expect(201);
    const second = await t.request
      .post('/api/v1/study-sessions')
      .send({ trackSlug: 'dsa', durationMinutes: 30, note: 'Big-O notes' })
      .expect(201);
    expect(second.body).toMatchObject({ localDate: DEFAULT_TODAY, source: 'manual' });

    const res = await t.request.get('/api/v1/dashboard').expect(200);
    expect(res.body.daily).toMatchObject({ studiedMinutes: 90, percent: 75 });
    expect(res.body.daily.byTrack).toEqual([
      { trackSlug: 'ai', targetMinutes: 60, studiedMinutes: 60 },
      { trackSlug: 'dsa', targetMinutes: 30, studiedMinutes: 30 },
      { trackSlug: 'system-design', targetMinutes: 30, studiedMinutes: 0 },
    ]);
    expect(res.body.weekly.totalMinutes).toBe(90);
    expect(res.body.weekly.days[0]).toMatchObject({ date: DEFAULT_TODAY, minutes: 90 });
    expect(res.body.streak).toMatchObject({ current: 1, longest: 1, todayCounts: true });
    expect(res.body.recentActivity[0]).toMatchObject({ type: 'study_session', minutes: 30 });
    const unlocked = res.body.achievements
      .filter((a: { unlocked: boolean }) => a.unlocked)
      .map((a: { key: string }) => a.key);
    expect(unlocked).toEqual(['first-session']);
  });

  it('unlocks the balanced-day achievement when every goal is met', async () => {
    for (const [trackSlug, durationMinutes] of [['ai', 60], ['dsa', 30], ['system-design', 30]] as const) {
      await t.request.post('/api/v1/study-sessions').send({ trackSlug, durationMinutes }).expect(201);
    }
    const res = await t.request.get('/api/v1/dashboard').expect(200);
    expect(res.body.daily.percent).toBe(100);
    const keys = res.body.achievements
      .filter((a: { unlocked: boolean }) => a.unlocked)
      .map((a: { key: string }) => a.key);
    expect(keys).toContain('balanced-day');
  });

  it('builds a streak across back-dated days and keeps it alive through today', async () => {
    for (const studiedOn of ['2026-10-17', '2026-10-18']) {
      await t.request
        .post('/api/v1/study-sessions')
        .send({ trackSlug: 'ai', durationMinutes: 20, studiedOn })
        .expect(201);
    }
    const res = await t.request.get('/api/v1/dashboard').expect(200);
    expect(res.body.streak).toMatchObject({ current: 2, longest: 2, todayCounts: false });
  });

  it('validates sessions: future dates, limits and unknown references', async () => {
    await t.request
      .post('/api/v1/study-sessions')
      .send({ trackSlug: 'ai', durationMinutes: 30, studiedOn: '2026-10-20' })
      .expect(400);
    await t.request.post('/api/v1/study-sessions').send({ trackSlug: 'ai', durationMinutes: 0 }).expect(400);
    await t.request.post('/api/v1/study-sessions').send({ trackSlug: 'ai', durationMinutes: 601 }).expect(400);
    await t.request.post('/api/v1/study-sessions').send({ trackSlug: 'music', durationMinutes: 30 }).expect(400);
    await t.request
      .post('/api/v1/study-sessions')
      .send({ trackSlug: 'ai', durationMinutes: 30, lessonSlug: 'ghost-lesson' })
      .expect(404);
    await t.request
      .post('/api/v1/study-sessions')
      .send({ trackSlug: 'ai', durationMinutes: 30, planTaskId: 999999 })
      .expect(404);
    await t.request
      .post('/api/v1/study-sessions')
      .send({ trackSlug: 'ai', durationMinutes: 30, studiedOn: '2025-01-01' })
      .expect(400);
  });

  it('can complete the linked plan task when logging a session', async () => {
    const week = await t.request.get('/api/v1/plan/weeks/1').expect(200);
    const task = week.body.days[0].tasks[0];
    const res = await t.request
      .post('/api/v1/study-sessions')
      .send({
        trackSlug: 'ai',
        durationMinutes: 60,
        planTaskId: task.id,
        lessonSlug: 'what-is-ai',
        completePlanTask: true,
      })
      .expect(201);
    expect(res.body).toMatchObject({ planTaskId: task.id, lessonSlug: 'what-is-ai' });

    const dashboard = await t.request.get('/api/v1/dashboard').expect(200);
    expect(dashboard.body.plan.overall.coreCompleted).toBe(1);
    expect(dashboard.body.nextUp.title).not.toBe('What is AI?');
  });

  it('lists and deletes sessions', async () => {
    const created = await t.request
      .post('/api/v1/study-sessions')
      .send({ trackSlug: 'system-design', durationMinutes: 25 })
      .expect(201);
    const list = await t.request.get('/api/v1/study-sessions?limit=5').expect(200);
    expect(list.body.sessions).toHaveLength(1);

    await t.request.delete(`/api/v1/study-sessions/${created.body.id}`).expect(204);
    const after = await t.request.get('/api/v1/study-sessions').expect(200);
    expect(after.body.sessions).toHaveLength(0);
    const dashboard = await t.request.get('/api/v1/dashboard').expect(200);
    expect(dashboard.body.recentActivity).toEqual([]);
    await t.request.delete(`/api/v1/study-sessions/${created.body.id}`).expect(404);
  });

  it('flags overdue core tasks as focus areas once days have passed', async () => {
    t.clock.set('2026-10-21T05:00:00.000Z');
    const res = await t.request.get('/api/v1/dashboard').expect(200);
    expect(res.body.plan.currentWeek).toBe(1);
    expect(res.body.todayTasks[0].dayOffset).toBe(2);
    expect(res.body.focusAreas).toEqual([
      { trackSlug: 'ai', reason: 'overdue_tasks', count: 2 },
      { trackSlug: 'dsa', reason: 'overdue_tasks', count: 2 },
      { trackSlug: 'system-design', reason: 'overdue_tasks', count: 2 },
    ]);
  });

  it('respects the learner time zone when deciding what "today" is', async () => {
    t.close();
    t = createTestApp({ now: '2026-10-19T20:00:00.000Z', timezone: 'Asia/Kolkata' });
    const res = await t.request.get('/api/v1/dashboard').expect(200);
    expect(res.body.today).toBe('2026-10-20');
    expect(res.body.plan.startDate).toBe('2026-10-20');
  });
});

describe('calendar, search and projects', () => {
  it('returns one calendar month with studied minutes and goal flags', async () => {
    for (const [trackSlug, durationMinutes] of [['ai', 60], ['dsa', 30], ['system-design', 30]] as const) {
      await t.request.post('/api/v1/study-sessions').send({ trackSlug, durationMinutes }).expect(201);
    }
    const res = await t.request.get('/api/v1/calendar?month=2026-10').expect(200);
    expect(res.body.days).toHaveLength(31);
    expect(res.body.totals).toEqual({ minutes: 120, activeDays: 1 });
    const today = res.body.days.find((day: { date: string }) => day.date === DEFAULT_TODAY);
    expect(today).toMatchObject({ minutes: 120, goalMet: true, tasksScheduled: 3, tasksCompleted: 0 });

    await t.request.get('/api/v1/calendar?month=2026-13').expect(400);
  });

  it('searches tracks, courses, lessons and projects with ranking', async () => {
    const res = await t.request.get('/api/v1/search?q=redis').expect(200);
    const types = new Set(res.body.results.map((r: { type: string }) => r.type));
    expect(types.has('lesson')).toBe(true);
    expect(res.body.results[0].title.toLowerCase()).toContain('redis');

    const exact = await t.request.get('/api/v1/search?q=rag%20mastery').expect(200);
    expect(exact.body.results[0]).toMatchObject({ type: 'course', slug: 'rag-mastery' });

    const none = await t.request.get('/api/v1/search?q=zzzzqqq').expect(200);
    expect(none.body).toMatchObject({ total: 0, results: [] });
    await t.request.get('/api/v1/search?q=a').expect(400);
  });

  it('tracks AI lab progress from real milestone checks', async () => {
    const list = await t.request.get('/api/v1/projects').expect(200);
    expect(list.body.projects).toHaveLength(10);
    expect(list.body.projects[0]).toMatchObject({
      slug: 'ts-llm-api-client',
      status: 'not_started',
      milestonesTotal: 5,
      milestonesDone: 0,
      contentStatus: 'planned',
    });

    const started = await t.request.post('/api/v1/projects/ts-llm-api-client/start').expect(200);
    expect(started.body.project.status).toBe('in_progress');
    const milestones: Array<{ id: number }> = started.body.milestones;

    const first = await t.request
      .put(`/api/v1/projects/ts-llm-api-client/milestones/${milestones[0]!.id}`)
      .send({ completed: true })
      .expect(200);
    expect(first.body.project).toMatchObject({ milestonesDone: 1, status: 'in_progress' });

    let last = first;
    for (const milestone of milestones.slice(1)) {
      last = await t.request
        .put(`/api/v1/projects/ts-llm-api-client/milestones/${milestone.id}`)
        .send({ completed: true })
        .expect(200);
    }
    expect(last.body.project).toMatchObject({ status: 'completed', milestonesDone: 5 });

    const reopened = await t.request
      .put(`/api/v1/projects/ts-llm-api-client/milestones/${milestones[2]!.id}`)
      .send({ completed: false })
      .expect(200);
    expect(reopened.body.project).toMatchObject({ status: 'in_progress', milestonesDone: 4 });

    const dashboard = await t.request.get('/api/v1/dashboard').expect(200);
    expect(dashboard.body.projects).toMatchObject({ started: 1, completed: 0, milestonesDone: 4 });
    expect(dashboard.body.projects.active[0].slug).toBe('ts-llm-api-client');

    await t.request
      .put(`/api/v1/projects/prompt-playground/milestones/${milestones[0]!.id}`)
      .send({ completed: true })
      .expect(404);
    await t.request.get('/api/v1/projects/no-such-project').expect(404);
  });

  it('resolves lab prerequisites into lesson and project references', async () => {
    const detail = await t.request.get('/api/v1/projects/local-rag-chatbot').expect(200);
    const prerequisites: Array<{ slug: string; title: string; type: string }> =
      detail.body.project.prerequisites;
    expect(prerequisites[0]).toMatchObject({ slug: 'pdf-qa-app', type: 'project' });
    expect(prerequisites[0]!.title).toContain('PDF');
    expect(prerequisites.slice(1)).toEqual([
      expect.objectContaining({ slug: 'retrieval-basics', type: 'lesson' }),
      expect.objectContaining({ slug: 'context-construction', type: 'lesson' }),
    ]);
    for (const item of prerequisites) expect(item.title.length).toBeGreaterThan(0);
  });
});
