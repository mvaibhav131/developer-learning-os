import type { Health } from '@dlos/shared';
import { count, eq, sql } from 'drizzle-orm';
import { nowIso, type AppContext } from '../../core/context';
import { courses, learningTracks, lessons } from '../../core/db/schema';
import { APP_VERSION } from '../../core/version';

const startedAt = Date.now();

export function getHealth(ctx: AppContext): Health {
  let databaseOk = true;
  let appliedMigrations = 0;
  let tracks = 0;
  let courseCount = 0;
  let lessonCount = 0;
  let lessonsWithContent = 0;

  try {
    appliedMigrations =
      ctx.db.all<{ n: number }>(sql`select count(*) as n from __drizzle_migrations`)[0]?.n ?? 0;
    tracks = ctx.db.select({ n: count() }).from(learningTracks).get()?.n ?? 0;
    courseCount = ctx.db.select({ n: count() }).from(courses).get()?.n ?? 0;
    lessonCount = ctx.db.select({ n: count() }).from(lessons).get()?.n ?? 0;
    lessonsWithContent =
      ctx.db.select({ n: count() }).from(lessons).where(eq(lessons.contentStatus, 'complete')).get()
        ?.n ?? 0;
  } catch (error) {
    databaseOk = false;
    ctx.logger.error({ err: error }, 'Health check could not read the database');
  }

  return {
    status: databaseOk ? 'ok' : 'degraded',
    version: APP_VERSION,
    environment: ctx.config.env,
    time: nowIso(ctx),
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
    database: { status: databaseOk ? 'ok' : 'error', appliedMigrations },
    content: { tracks, courses: courseCount, lessons: lessonCount, lessonsWithContent },
    ai: {
      provider: 'none',
      status: 'not_configured',
      message:
        'No AI provider is configured. Every learning feature works without one; AI features arrive in a later phase and will be clearly labelled.',
    },
  };
}
