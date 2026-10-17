import {
  CORE_DAYS_PER_WEEK,
  ROADMAP_WEEK_COUNT,
  TRACK_SLUGS,
  addDays,
  enumerateDates,
  startOfWeek,
  type Dashboard,
  type PlanTask,
  type TrackSlug,
} from '@dlos/shared';
import { and, count, desc, eq, sql } from 'drizzle-orm';
import { nowIso, todayIn, type AppContext } from '../../core/context';
import {
  codingProblems,
  courses,
  learningTracks,
  lessonProgress,
  lessonResources,
  lessons,
  progressEvents,
  projectMilestones,
  projects,
  reviewSchedules,
  studySessions,
  userProjectMilestones,
  userProjects,
} from '../../core/db/schema';
import {
  computePlanState,
  loadTaskRows,
  loadWeekSummaries,
  planEndDate,
  requirePlan,
  toTaskDto,
} from '../plan/plan.service';
import { getPreferences } from '../preferences/preferences.service';
import { loadProblemStats } from '../practice/practice.service';
import { evaluateAchievements } from './achievements';
import { computeStreak } from './streak';

export const WEEK_STARTS_ON = 1 as const;

const pct = (value: number, total: number): number =>
  total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;

const ASSIGNMENT_KINDS = new Set<PlanTask['kind']>(['project', 'assessment', 'interview']);

export interface DaySessions {
  minutes: number;
  sessions: number;
  byTrack: Record<TrackSlug, number>;
}

function emptyByTrack(): Record<TrackSlug, number> {
  return Object.fromEntries(TRACK_SLUGS.map((slug) => [slug, 0])) as Record<TrackSlug, number>;
}

export function loadSessionDays(ctx: AppContext): Map<string, DaySessions> {
  const rows = ctx.db
    .select({
      localDate: studySessions.localDate,
      trackSlug: studySessions.trackSlug,
      minutes: sql<number>`sum(${studySessions.durationMinutes})`.mapWith(Number),
      sessions: sql<number>`count(*)`.mapWith(Number),
    })
    .from(studySessions)
    .where(eq(studySessions.userId, ctx.userId))
    .groupBy(studySessions.localDate, studySessions.trackSlug)
    .all();

  const days = new Map<string, DaySessions>();
  for (const row of rows) {
    const day = days.get(row.localDate) ?? { minutes: 0, sessions: 0, byTrack: emptyByTrack() };
    day.minutes += row.minutes;
    day.sessions += row.sessions;
    day.byTrack[row.trackSlug] += row.minutes;
    days.set(row.localDate, day);
  }
  return days;
}

/** One lesson to open next: resume the latest in-progress one, else the next unfinished in that course, else the first ready lesson. */
function pickContinueLesson(ctx: AppContext): Dashboard['continueLesson'] {
  const ready = ctx.db
    .select({
      id: lessons.id,
      slug: lessons.slug,
      title: lessons.title,
      minutes: lessons.estimatedMinutes,
      courseId: lessons.courseId,
      order: lessons.sortOrder,
      courseSlug: courses.slug,
      courseTitle: courses.title,
      trackSlug: learningTracks.slug,
    })
    .from(lessons)
    .innerJoin(courses, eq(courses.id, lessons.courseId))
    .innerJoin(learningTracks, eq(learningTracks.id, courses.trackId))
    .where(eq(lessons.contentStatus, 'complete'))
    .orderBy(learningTracks.sortOrder, courses.sortOrder, lessons.sortOrder)
    .all();
  if (ready.length === 0) return null;

  const progress = new Map(
    ctx.db
      .select()
      .from(lessonProgress)
      .where(eq(lessonProgress.userId, ctx.userId))
      .all()
      .map((row) => [row.lessonId, row] as const),
  );
  const statusOf = (id: number) => progress.get(id)?.status ?? 'not_started';
  const touched = (id: number) => progress.get(id)?.lastAccessedAt ?? '';

  const resume = ready
    .filter((lesson) => statusOf(lesson.id) === 'in_progress')
    .sort((a, b) => touched(b.id).localeCompare(touched(a.id)))[0];
  const lastDone = ready
    .filter((lesson) => statusOf(lesson.id) === 'completed')
    .sort((a, b) => touched(b.id).localeCompare(touched(a.id)))[0];
  const afterLastDone = lastDone
    ? ready.find(
        (lesson) =>
          lesson.courseId === lastDone.courseId &&
          lesson.order > lastDone.order &&
          statusOf(lesson.id) !== 'completed',
      )
    : undefined;
  const firstOpen = ready.find((lesson) => statusOf(lesson.id) !== 'completed');

  const pick = resume ?? afterLastDone ?? firstOpen;
  if (!pick) return null;
  const hasVideo =
    (ctx.db.select({ n: count() }).from(lessonResources).where(eq(lessonResources.lessonId, pick.id)).get()?.n ?? 0) > 0;
  return {
    slug: pick.slug,
    title: pick.title,
    trackSlug: pick.trackSlug,
    courseSlug: pick.courseSlug,
    courseTitle: pick.courseTitle,
    minutes: pick.minutes,
    reason: resume ? 'resume' : lastDone ? 'next' : 'start',
    hasVideo,
  };
}

export function getDashboard(ctx: AppContext): Dashboard {
  const prefs = getPreferences(ctx);
  const today = todayIn(ctx, prefs.timezone);
  const plan = requirePlan(ctx);
  const rows = loadTaskRows(ctx, plan.id);
  const tasks = rows.map((row) => toTaskDto(plan, row));
  const { state, currentWeek, daysUntilStart } = computePlanState(plan.startDate, today);
  const weekSummaries = loadWeekSummaries(ctx, plan, rows);
  const sessionDays = loadSessionDays(ctx);

  const goals = prefs.dailyGoals;
  const dailyTarget = TRACK_SLUGS.reduce((sum, slug) => sum + goals[slug], 0);

  // --- plan ---------------------------------------------------------------------------------
  const coreTasks = tasks.filter((task) => !task.isOptional);
  const coreCompleted = coreTasks.filter((task) => task.completedAt).length;
  const currentWeekSummary = currentWeek
    ? weekSummaries.find((week) => week.weekNumber === currentWeek)
    : undefined;
  const weekTasks = currentWeek ? tasks.filter((task) => task.weekNumber === currentWeek) : [];

  // --- today --------------------------------------------------------------------------------
  const todaySessions = sessionDays.get(today);
  const studiedToday = todaySessions?.minutes ?? 0;
  const todayTasks = tasks.filter((task) => task.scheduledDate === today);
  const nextUp = tasks.find((task) => !task.isOptional && !task.completedAt) ?? null;

  // --- week ---------------------------------------------------------------------------------
  const weekStart = startOfWeek(today, WEEK_STARTS_ON);
  const weeklyDays = enumerateDates(weekStart, addDays(weekStart, 6)).map((date) => {
    const day = sessionDays.get(date);
    return { date, minutes: day?.minutes ?? 0, byTrack: day?.byTrack ?? emptyByTrack() };
  });

  // --- streak, lessons, reviews ------------------------------------------------------------
  const minutesByDate = new Map([...sessionDays].map(([date, day]) => [date, day.minutes]));
  const streak = computeStreak(minutesByDate, today, prefs.streakMinMinutes);

  const catalogTotal = ctx.db.select({ n: count() }).from(lessons).get()?.n ?? 0;
  const authoredTotal =
    ctx.db.select({ n: count() }).from(lessons).where(eq(lessons.contentStatus, 'complete')).get()
      ?.n ?? 0;
  const progressCounts = new Map(
    ctx.db
      .select({ status: lessonProgress.status, n: count() })
      .from(lessonProgress)
      .where(eq(lessonProgress.userId, ctx.userId))
      .groupBy(lessonProgress.status)
      .all()
      .map((row) => [row.status, row.n] as const),
  );

  const continueLearning = ctx.db
    .select({
      slug: lessons.slug,
      title: lessons.title,
      courseSlug: courses.slug,
      courseTitle: courses.title,
      trackSlug: learningTracks.slug,
      progressPercent: lessonProgress.progressPercent,
      lastAccessedAt: lessonProgress.lastAccessedAt,
    })
    .from(lessonProgress)
    .innerJoin(lessons, eq(lessons.id, lessonProgress.lessonId))
    .innerJoin(courses, eq(courses.id, lessons.courseId))
    .innerJoin(learningTracks, eq(learningTracks.id, courses.trackId))
    .where(and(eq(lessonProgress.userId, ctx.userId), eq(lessonProgress.status, 'in_progress')))
    .orderBy(desc(lessonProgress.lastAccessedAt))
    .limit(3)
    .all()
    .map((row) => ({
      lesson: {
        slug: row.slug,
        title: row.title,
        trackSlug: row.trackSlug,
        courseSlug: row.courseSlug,
        courseTitle: row.courseTitle,
      },
      progressPercent: row.progressPercent,
      lastAccessedAt: row.lastAccessedAt ?? nowIso(ctx),
    }));

  const dueRows = ctx.db
    .select({ dueDate: reviewSchedules.dueDate, n: count() })
    .from(reviewSchedules)
    .where(eq(reviewSchedules.userId, ctx.userId))
    .groupBy(reviewSchedules.dueDate)
    .all();
  const activeDue = dueRows.filter((row) => row.dueDate <= today).reduce((sum, row) => sum + row.n, 0);
  const upcomingReviews = dueRows
    .filter((row) => row.dueDate > today && row.dueDate <= addDays(today, 7))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .map((row) => ({ date: row.dueDate, count: row.n }));

  // --- focus areas and assignments ------------------------------------------------------------
  const overdue = tasks.filter(
    (task) => !task.isOptional && !task.completedAt && task.scheduledDate < today,
  );
  const focusAreas = TRACK_SLUGS.flatMap((trackSlug) => {
    const overdueCount = overdue.filter((task) => task.trackSlug === trackSlug).length;
    return overdueCount > 0
      ? [{ trackSlug, reason: 'overdue_tasks' as const, count: overdueCount }]
      : [];
  }).sort((a, b) => b.count - a.count);

  const upcomingAssignments = tasks
    .filter(
      (task) =>
        ASSIGNMENT_KINDS.has(task.kind) && !task.completedAt && task.scheduledDate >= today,
    )
    .slice(0, 5);

  // --- projects -----------------------------------------------------------------------------
  const projectRows = ctx.db.select().from(projects).orderBy(projects.sortOrder).all();
  const milestoneTotals = new Map(
    ctx.db
      .select({ projectId: projectMilestones.projectId, n: count() })
      .from(projectMilestones)
      .groupBy(projectMilestones.projectId)
      .all()
      .map((row) => [row.projectId, row.n] as const),
  );
  const milestoneDone = new Map(
    ctx.db
      .select({ projectId: projectMilestones.projectId, n: count() })
      .from(userProjectMilestones)
      .innerJoin(projectMilestones, eq(projectMilestones.id, userProjectMilestones.milestoneId))
      .where(eq(userProjectMilestones.userId, ctx.userId))
      .groupBy(projectMilestones.projectId)
      .all()
      .map((row) => [row.projectId, row.n] as const),
  );
  const projectStatus = new Map(
    ctx.db
      .select({ projectId: userProjects.projectId, status: userProjects.status })
      .from(userProjects)
      .where(eq(userProjects.userId, ctx.userId))
      .all()
      .map((row) => [row.projectId, row.status] as const),
  );
  const projectSummary = {
    total: projectRows.length,
    started: 0,
    completed: 0,
    milestonesDone: 0,
    milestonesTotal: 0,
    active: [] as Dashboard['projects']['active'],
  };
  for (const project of projectRows) {
    const total = milestoneTotals.get(project.id) ?? 0;
    const done = milestoneDone.get(project.id) ?? 0;
    const status = projectStatus.get(project.id) ?? 'not_started';
    projectSummary.milestonesTotal += total;
    projectSummary.milestonesDone += done;
    if (status !== 'not_started') projectSummary.started += 1;
    if (status === 'completed') projectSummary.completed += 1;
    if (status === 'in_progress') {
      projectSummary.active.push({
        slug: project.slug,
        title: project.title,
        milestonesDone: done,
        milestonesTotal: total,
      });
    }
  }

  // --- readiness ----------------------------------------------------------------------------
  const practiceStats = [...loadProblemStats(ctx).values()];
  const practiceTotal =
    ctx.db.select({ n: count() }).from(codingProblems).where(eq(codingProblems.contentStatus, 'complete')).get()?.n ?? 0;
  const practice = {
    total: practiceTotal,
    solved: practiceStats.filter((stat) => stat.status === 'solved').length,
    attempted: practiceStats.filter((stat) => stat.status === 'attempted').length,
  };
  const planPercent = pct(coreCompleted, coreTasks.length);
  const completedLessons = progressCounts.get('completed') ?? 0;
  const lessonsPercent = authoredTotal > 0 ? pct(completedLessons, authoredTotal) : null;
  const signals = [
    { key: 'plan_progress' as const, percent: planPercent, weight: 0.4 },
    { key: 'lessons' as const, percent: lessonsPercent, weight: 0.2 },
    { key: 'practice' as const, percent: practiceTotal > 0 ? pct(practice.solved, practiceTotal) : null, weight: 0.25 },
    { key: 'interviews' as const, percent: null, weight: 0.15 },
  ];
  const available = signals.filter((signal) => signal.percent !== null);
  const weightSum = available.reduce((sum, signal) => sum + signal.weight, 0);
  const readinessPercent =
    weightSum > 0
      ? Math.round(
          available.reduce((sum, signal) => sum + (signal.percent ?? 0) * signal.weight, 0) /
            weightSum,
        )
      : 0;

  // --- activity and achievements ----------------------------------------------------------------
  const recentActivity = ctx.db
    .select()
    .from(progressEvents)
    .where(eq(progressEvents.userId, ctx.userId))
    .orderBy(desc(progressEvents.occurredAt), desc(progressEvents.id))
    .limit(10)
    .all()
    .map((event) => {
      const payload = event.payload;
      const title = typeof payload.title === 'string' ? payload.title : null;
      const trackSlug = TRACK_SLUGS.find((slug) => slug === payload.trackSlug) ?? null;
      const minutes = typeof payload.minutes === 'number' ? Math.round(payload.minutes) : null;
      return {
        id: event.id,
        type: event.eventType,
        occurredAt: event.occurredAt,
        title,
        trackSlug,
        minutes,
      };
    });

  let totalMinutes = 0;
  let totalSessions = 0;
  let hasBalancedDay = false;
  for (const day of sessionDays.values()) {
    totalMinutes += day.minutes;
    totalSessions += day.sessions;
    const goalTracks = TRACK_SLUGS.filter((slug) => goals[slug] > 0);
    if (goalTracks.length > 0 && goalTracks.every((slug) => day.byTrack[slug] >= goals[slug])) {
      hasBalancedDay = true;
    }
  }
  const achievements = evaluateAchievements({
    totalSessions,
    totalMinutes,
    completedTasks: tasks.filter((task) => task.completedAt).length,
    longestStreak: streak.longest,
    hasBalancedDay,
    hasPerfectWeek: weekSummaries.some(
      (week) => week.totals.coreTasks > 0 && week.totals.coreCompleted === week.totals.coreTasks,
    ),
  });

  return {
    generatedAt: nowIso(ctx),
    today,
    timezone: prefs.timezone,
    profile: { displayName: prefs.displayName },
    plan: {
      state,
      startDate: plan.startDate,
      endDate: planEndDate(plan),
      daysUntilStart,
      currentWeek,
      totalWeeks: ROADMAP_WEEK_COUNT,
      week: currentWeekSummary
        ? {
            weekNumber: currentWeekSummary.weekNumber,
            title: currentWeekSummary.title,
            phaseKey: currentWeekSummary.phaseKey,
            phaseTitle: currentWeekSummary.phaseTitle,
            summary: currentWeekSummary.summary,
            goals: currentWeekSummary.goals,
            deliverable: currentWeekSummary.deliverable,
            coreTasks: weekTasks.filter((task) => !task.isOptional).length,
            coreCompleted: weekTasks.filter((task) => !task.isOptional && task.completedAt).length,
            optionalTasks: weekTasks.filter((task) => task.isOptional).length,
            optionalCompleted: weekTasks.filter((task) => task.isOptional && task.completedAt)
              .length,
          }
        : null,
      overall: {
        coreTasks: coreTasks.length,
        coreCompleted,
        percent: planPercent,
      },
    },
    daily: {
      targetMinutes: dailyTarget,
      studiedMinutes: studiedToday,
      percent: pct(studiedToday, dailyTarget),
      byTrack: TRACK_SLUGS.filter(
        (slug) => goals[slug] > 0 || (todaySessions?.byTrack[slug] ?? 0) > 0,
      ).map((slug) => ({
        trackSlug: slug,
        targetMinutes: goals[slug],
        studiedMinutes: todaySessions?.byTrack[slug] ?? 0,
      })),
    },
    todayTasks,
    nextUp,
    weekly: {
      weekStart,
      totalMinutes: weeklyDays.reduce((sum, day) => sum + day.minutes, 0),
      targetMinutes: dailyTarget * CORE_DAYS_PER_WEEK,
      days: weeklyDays,
    },
    streak: { ...streak, minMinutes: prefs.streakMinMinutes },
    lessons: {
      completed: completedLessons,
      inProgress: progressCounts.get('in_progress') ?? 0,
      catalogTotal,
      authoredTotal,
    },
    continueLearning,
    continueLesson: pickContinueLesson(ctx),
    practice,
    reviews: { dueToday: activeDue, upcoming: upcomingReviews },
    focusAreas,
    upcomingAssignments,
    projects: projectSummary,
    readiness: { percent: readinessPercent, signals },
    recentActivity,
    achievements,
  };
}
