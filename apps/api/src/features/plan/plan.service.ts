import {
  ROADMAP_WEEK_COUNT,
  addDays,
  diffDays,
  type ContentStatus,
  type CreatePlanTask,
  type PlanOverview,
  type PlanState,
  type PlanTask,
  type PlanTotals,
  type PlanWeekDetail,
  type PlanWeekSummary,
  type UpdatePlanTask,
} from '@dlos/shared';
import { and, asc, eq } from 'drizzle-orm';
import { nowIso, todayIn, type AppContext } from '../../core/context';
import { lessons, studyPlans, studyPlanTasks, studyPlanWeeks } from '../../core/db/schema';
import { badRequest, notFound } from '../../core/errors';
import { recordEvent, removeEvents } from '../activity/events';
import { getPreferences } from '../preferences/preferences.service';
import { createPlanFromTemplate, getActivePlanRow, type PlanRow } from './plan.template';

export interface PlanTaskRow {
  task: typeof studyPlanTasks.$inferSelect;
  lessonSlug: string | null;
  lessonTitle: string | null;
  lessonStatus: ContentStatus | null;
}

export const PLAN_DAY_COUNT = ROADMAP_WEEK_COUNT * 7;

export function requirePlan(ctx: AppContext): PlanRow {
  const existing = getActivePlanRow(ctx.db, ctx.userId);
  if (existing) return existing;
  const prefs = getPreferences(ctx);
  createPlanFromTemplate(ctx.db, {
    userId: ctx.userId,
    startDate: todayIn(ctx, prefs.timezone),
    now: nowIso(ctx),
  });
  const created = getActivePlanRow(ctx.db, ctx.userId);
  if (!created) throw new Error('Failed to create the study plan');
  return created;
}

export function planEndDate(plan: Pick<PlanRow, 'startDate'>): string {
  return addDays(plan.startDate, PLAN_DAY_COUNT - 1);
}

export function taskDate(plan: Pick<PlanRow, 'startDate'>, weekNumber: number, dayOffset: number): string {
  return addDays(plan.startDate, (weekNumber - 1) * 7 + dayOffset);
}

export function computePlanState(
  startDate: string,
  today: string,
): { state: PlanState; currentWeek: number | null; daysUntilStart: number | null } {
  if (today < startDate) {
    return { state: 'upcoming', currentWeek: null, daysUntilStart: diffDays(startDate, today) };
  }
  const elapsed = diffDays(today, startDate);
  if (elapsed >= PLAN_DAY_COUNT) {
    return { state: 'completed', currentWeek: ROADMAP_WEEK_COUNT, daysUntilStart: null };
  }
  return { state: 'active', currentWeek: Math.floor(elapsed / 7) + 1, daysUntilStart: null };
}

export function loadTaskRows(ctx: AppContext, planId: number): PlanTaskRow[] {
  return ctx.db
    .select({
      task: studyPlanTasks,
      lessonSlug: lessons.slug,
      lessonTitle: lessons.title,
      lessonStatus: lessons.contentStatus,
    })
    .from(studyPlanTasks)
    .leftJoin(lessons, eq(lessons.id, studyPlanTasks.lessonId))
    .where(eq(studyPlanTasks.planId, planId))
    .orderBy(
      asc(studyPlanTasks.weekNumber),
      asc(studyPlanTasks.dayOffset),
      asc(studyPlanTasks.sortOrder),
      asc(studyPlanTasks.id),
    )
    .all();
}

export function loadTaskRow(ctx: AppContext, planId: number, taskId: number): PlanTaskRow | undefined {
  return ctx.db
    .select({
      task: studyPlanTasks,
      lessonSlug: lessons.slug,
      lessonTitle: lessons.title,
      lessonStatus: lessons.contentStatus,
    })
    .from(studyPlanTasks)
    .leftJoin(lessons, eq(lessons.id, studyPlanTasks.lessonId))
    .where(and(eq(studyPlanTasks.planId, planId), eq(studyPlanTasks.id, taskId)))
    .get();
}

export function toTaskDto(plan: Pick<PlanRow, 'startDate'>, row: PlanTaskRow): PlanTask {
  const { task } = row;
  return {
    id: task.id,
    weekNumber: task.weekNumber,
    dayOffset: task.dayOffset,
    scheduledDate: taskDate(plan, task.weekNumber, task.dayOffset),
    trackSlug: task.trackSlug,
    kind: task.kind,
    title: task.title,
    description: task.description,
    plannedMinutes: task.plannedMinutes,
    isOptional: task.isOptional,
    isCustom: task.isCustom,
    completedAt: task.completedAt,
    projectSlug: task.projectSlug,
    lesson:
      row.lessonSlug && row.lessonTitle && row.lessonStatus
        ? { slug: row.lessonSlug, title: row.lessonTitle, contentStatus: row.lessonStatus }
        : null,
  };
}

export function emptyTotals(): PlanTotals {
  return {
    tasks: 0,
    completed: 0,
    coreTasks: 0,
    coreCompleted: 0,
    plannedMinutes: 0,
    completedMinutes: 0,
  };
}

export function addToTotals(
  totals: PlanTotals,
  task: { isOptional: boolean; completedAt: string | null; plannedMinutes: number },
): void {
  totals.tasks += 1;
  totals.plannedMinutes += task.plannedMinutes;
  if (!task.isOptional) totals.coreTasks += 1;
  if (task.completedAt) {
    totals.completed += 1;
    totals.completedMinutes += task.plannedMinutes;
    if (!task.isOptional) totals.coreCompleted += 1;
  }
}

function mergeTotals(into: PlanTotals, from: PlanTotals): void {
  into.tasks += from.tasks;
  into.completed += from.completed;
  into.coreTasks += from.coreTasks;
  into.coreCompleted += from.coreCompleted;
  into.plannedMinutes += from.plannedMinutes;
  into.completedMinutes += from.completedMinutes;
}

export function loadWeekSummaries(
  ctx: AppContext,
  plan: PlanRow,
  rows: PlanTaskRow[],
): PlanWeekSummary[] {
  const totalsByWeek = new Map<number, PlanTotals>();
  for (const { task } of rows) {
    const totals = totalsByWeek.get(task.weekNumber) ?? emptyTotals();
    addToTotals(totals, task);
    totalsByWeek.set(task.weekNumber, totals);
  }
  return ctx.db
    .select()
    .from(studyPlanWeeks)
    .where(eq(studyPlanWeeks.planId, plan.id))
    .orderBy(asc(studyPlanWeeks.weekNumber))
    .all()
    .map((week) => ({
      weekNumber: week.weekNumber,
      phaseKey: week.phaseKey,
      phaseTitle: week.phaseTitle,
      title: week.title,
      summary: week.summary,
      goals: week.goals,
      deliverable: week.deliverable,
      startDate: addDays(plan.startDate, (week.weekNumber - 1) * 7),
      endDate: addDays(plan.startDate, (week.weekNumber - 1) * 7 + 6),
      totals: totalsByWeek.get(week.weekNumber) ?? emptyTotals(),
    }));
}

export function getPlanOverview(ctx: AppContext): PlanOverview {
  const plan = requirePlan(ctx);
  const prefs = getPreferences(ctx);
  const today = todayIn(ctx, prefs.timezone);
  const rows = loadTaskRows(ctx, plan.id);
  const weeks = loadWeekSummaries(ctx, plan, rows);

  const totals = emptyTotals();
  const phases: PlanOverview['phases'] = [];
  for (const week of weeks) {
    mergeTotals(totals, week.totals);
    let phase = phases.find((candidate) => candidate.key === week.phaseKey);
    if (!phase) {
      phase = {
        key: week.phaseKey,
        title: week.phaseTitle,
        weekStart: week.weekNumber,
        weekEnd: week.weekNumber,
        totals: emptyTotals(),
      };
      phases.push(phase);
    }
    phase.weekEnd = week.weekNumber;
    mergeTotals(phase.totals, week.totals);
  }

  return {
    plan: {
      id: plan.id,
      name: plan.name,
      startDate: plan.startDate,
      endDate: planEndDate(plan),
      weekCount: ROADMAP_WEEK_COUNT,
    },
    today,
    ...computePlanState(plan.startDate, today),
    totals,
    phases,
    weeks,
  };
}

export function getPlanWeekDetail(ctx: AppContext, weekNumber: number): PlanWeekDetail {
  const plan = requirePlan(ctx);
  const rows = loadTaskRows(ctx, plan.id);
  const week = loadWeekSummaries(ctx, plan, rows).find((item) => item.weekNumber === weekNumber);
  if (!week) throw notFound(`Week ${weekNumber}`);

  const days = Array.from({ length: 7 }, (_, dayOffset) => ({
    dayOffset,
    date: addDays(week.startDate, dayOffset),
    tasks: rows
      .filter(({ task }) => task.weekNumber === weekNumber && task.dayOffset === dayOffset)
      .map((row) => toTaskDto(plan, row)),
  }));
  return { week, days };
}

function requireTask(ctx: AppContext, plan: PlanRow, id: number): PlanTaskRow {
  const row = loadTaskRow(ctx, plan.id, id);
  if (!row) throw notFound(`Task ${id}`);
  return row;
}

export function createPlanTask(ctx: AppContext, body: CreatePlanTask): PlanTask {
  const plan = requirePlan(ctx);
  const now = nowIso(ctx);
  const inserted = ctx.db
    .insert(studyPlanTasks)
    .values({
      planId: plan.id,
      weekNumber: body.weekNumber,
      dayOffset: body.dayOffset,
      trackSlug: body.trackSlug,
      kind: body.kind ?? 'practice',
      title: body.title,
      description: body.description ?? null,
      plannedMinutes: body.plannedMinutes,
      isOptional: body.isOptional ?? false,
      isCustom: true,
      sortOrder: 100,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: studyPlanTasks.id })
    .get();
  if (!inserted) throw new Error('Failed to create the task');
  return toTaskDto(plan, requireTask(ctx, plan, inserted.id));
}

export function updatePlanTask(ctx: AppContext, id: number, patch: UpdatePlanTask): PlanTask {
  const plan = requirePlan(ctx);
  const existing = requireTask(ctx, plan, id).task;
  const prefs = getPreferences(ctx);
  const now = nowIso(ctx);
  const today = todayIn(ctx, prefs.timezone);

  const changes: Partial<typeof studyPlanTasks.$inferInsert> = { updatedAt: now };
  if (patch.title !== undefined) changes.title = patch.title;
  if (patch.description !== undefined) changes.description = patch.description;
  if (patch.trackSlug !== undefined) changes.trackSlug = patch.trackSlug;
  if (patch.kind !== undefined) changes.kind = patch.kind;
  if (patch.plannedMinutes !== undefined) changes.plannedMinutes = patch.plannedMinutes;
  if (patch.isOptional !== undefined) changes.isOptional = patch.isOptional;

  if (patch.scheduledDate !== undefined) {
    const offset = diffDays(patch.scheduledDate, plan.startDate);
    if (offset < 0 || offset >= PLAN_DAY_COUNT) {
      throw badRequest(
        `The date must fall inside the plan (${plan.startDate} to ${planEndDate(plan)}).`,
      );
    }
    changes.weekNumber = Math.floor(offset / 7) + 1;
    changes.dayOffset = offset % 7;
  }

  const becomesCompleted = patch.completed === true && existing.completedAt === null;
  const becomesOpen = patch.completed === false && existing.completedAt !== null;
  if (becomesCompleted) changes.completedAt = now;
  if (becomesOpen) changes.completedAt = null;

  ctx.db.transaction((tx) => {
    tx.update(studyPlanTasks).set(changes).where(eq(studyPlanTasks.id, id)).run();
  });

  if (becomesCompleted) {
    recordEvent(ctx, {
      type: 'task_completed',
      entityType: 'plan_task',
      entityId: id,
      localDate: today,
      payload: {
        title: changes.title ?? existing.title,
        trackSlug: changes.trackSlug ?? existing.trackSlug,
        minutes: changes.plannedMinutes ?? existing.plannedMinutes,
      },
    });
  }
  if (becomesOpen) removeEvents(ctx, 'task_completed', 'plan_task', id);

  return toTaskDto(plan, requireTask(ctx, plan, id));
}

export function deletePlanTask(ctx: AppContext, id: number): void {
  const plan = requirePlan(ctx);
  requireTask(ctx, plan, id);
  ctx.db.delete(studyPlanTasks).where(eq(studyPlanTasks.id, id)).run();
}

export function updatePlan(
  ctx: AppContext,
  patch: { name?: string | undefined; startDate?: string | undefined },
): PlanOverview {
  const plan = requirePlan(ctx);
  const now = nowIso(ctx);
  ctx.db
    .update(studyPlans)
    .set({
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.startDate !== undefined ? { startDate: patch.startDate } : {}),
      updatedAt: now,
    })
    .where(eq(studyPlans.id, plan.id))
    .run();

  if (patch.startDate !== undefined && patch.startDate !== plan.startDate) {
    const prefs = getPreferences(ctx);
    recordEvent(ctx, {
      type: 'plan_started',
      entityType: 'plan',
      entityId: plan.id,
      localDate: todayIn(ctx, prefs.timezone),
      payload: { startDate: patch.startDate },
    });
  }
  return getPlanOverview(ctx);
}

export function resetPlan(ctx: AppContext): PlanOverview {
  const plan = requirePlan(ctx);
  const prefs = getPreferences(ctx);
  const now = nowIso(ctx);
  ctx.db.transaction((tx) => {
    tx.delete(studyPlans).where(eq(studyPlans.id, plan.id)).run();
  });
  const planId = createPlanFromTemplate(ctx.db, {
    userId: ctx.userId,
    startDate: plan.startDate,
    now,
    name: plan.name,
  });
  recordEvent(ctx, {
    type: 'plan_reset',
    entityType: 'plan',
    entityId: planId,
    localDate: todayIn(ctx, prefs.timezone),
    payload: { startDate: plan.startDate },
  });
  return getPlanOverview(ctx);
}
