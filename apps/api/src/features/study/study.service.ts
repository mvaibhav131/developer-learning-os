import {
  diffDays,
  formatLocalDate,
  type StudySession,
  type createStudySessionSchema,
} from '@dlos/shared';
import { and, desc, eq, gte, lte } from 'drizzle-orm';
import type { z } from 'zod';
import { nowIso, type AppContext } from '../../core/context';
import { lessons, studySessions } from '../../core/db/schema';
import { badRequest, notFound } from '../../core/errors';
import { recordEvent, removeEvents } from '../activity/events';
import { loadTaskRow, requirePlan, updatePlanTask } from '../plan/plan.service';
import { getPreferences } from '../preferences/preferences.service';

type CreateBody = z.output<typeof createStudySessionSchema>;

const MAX_BACKFILL_DAYS = 90;

function toDto(row: typeof studySessions.$inferSelect, lessonSlug: string | null): StudySession {
  return {
    id: row.id,
    trackSlug: row.trackSlug,
    durationMinutes: row.durationMinutes,
    startedAt: row.startedAt,
    localDate: row.localDate,
    source: row.source,
    note: row.note,
    planTaskId: row.planTaskId,
    lessonSlug,
  };
}

export function createStudySession(ctx: AppContext, body: CreateBody): StudySession {
  const prefs = getPreferences(ctx);
  const now = ctx.clock.now();
  const today = formatLocalDate(now, prefs.timezone);
  const localDate = body.studiedOn ?? today;
  if (localDate > today) throw badRequest('Study sessions cannot be logged for a future date.');
  if (diffDays(today, localDate) > MAX_BACKFILL_DAYS) {
    throw badRequest(`Study sessions older than ${MAX_BACKFILL_DAYS} days cannot be logged.`);
  }

  let lessonId: number | null = null;
  if (body.lessonSlug) {
    const lesson = ctx.db
      .select({ id: lessons.id })
      .from(lessons)
      .where(eq(lessons.slug, body.lessonSlug))
      .get();
    if (!lesson) throw notFound(`Lesson "${body.lessonSlug}"`);
    lessonId = lesson.id;
  }

  const plan = body.planTaskId === undefined ? undefined : requirePlan(ctx);
  const taskRow =
    plan && body.planTaskId !== undefined ? loadTaskRow(ctx, plan.id, body.planTaskId) : undefined;
  if (body.planTaskId !== undefined && !taskRow) throw notFound(`Task ${body.planTaskId}`);

  const startedAt =
    localDate === today
      ? new Date(now.getTime() - body.durationMinutes * 60_000).toISOString()
      : `${localDate}T12:00:00.000Z`;

  return ctx.db.transaction(() => {
    const inserted = ctx.db
      .insert(studySessions)
      .values({
        userId: ctx.userId,
        trackSlug: body.trackSlug,
        startedAt,
        durationMinutes: body.durationMinutes,
        localDate,
        source: body.source,
        lessonId,
        planTaskId: body.planTaskId ?? null,
        note: body.note ?? null,
        createdAt: nowIso(ctx),
      })
      .returning()
      .get();
    if (!inserted) throw new Error('Failed to log the study session');

    recordEvent(ctx, {
      type: 'study_session',
      entityType: 'study_session',
      entityId: inserted.id,
      localDate,
      payload: {
        trackSlug: body.trackSlug,
        minutes: body.durationMinutes,
        title: taskRow?.task.title ?? null,
        note: body.note ?? null,
      },
    });

    if (body.completePlanTask && taskRow && !taskRow.task.completedAt) {
      updatePlanTask(ctx, taskRow.task.id, { completed: true });
    }
    return toDto(inserted, body.lessonSlug ?? null);
  });
}

export function listStudySessions(
  ctx: AppContext,
  filters: { from?: string | undefined; to?: string | undefined; limit: number },
): StudySession[] {
  const conditions = [eq(studySessions.userId, ctx.userId)];
  if (filters.from) conditions.push(gte(studySessions.localDate, filters.from));
  if (filters.to) conditions.push(lte(studySessions.localDate, filters.to));

  return ctx.db
    .select({ session: studySessions, lessonSlug: lessons.slug })
    .from(studySessions)
    .leftJoin(lessons, eq(lessons.id, studySessions.lessonId))
    .where(and(...conditions))
    .orderBy(desc(studySessions.localDate), desc(studySessions.id))
    .limit(filters.limit)
    .all()
    .map((row) => toDto(row.session, row.lessonSlug));
}

export function deleteStudySession(ctx: AppContext, id: number): void {
  const existing = ctx.db
    .select({ id: studySessions.id })
    .from(studySessions)
    .where(and(eq(studySessions.id, id), eq(studySessions.userId, ctx.userId)))
    .get();
  if (!existing) throw notFound(`Study session ${id}`);
  ctx.db.transaction(() => {
    ctx.db.delete(studySessions).where(eq(studySessions.id, id)).run();
    removeEvents(ctx, 'study_session', 'study_session', id);
  });
}
