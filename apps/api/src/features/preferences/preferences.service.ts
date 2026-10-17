import {
  DEFAULT_DAILY_GOALS,
  type Preferences,
  type UpdatePreferences,
} from '@dlos/shared';
import { eq } from 'drizzle-orm';
import { nowIso, type AppContext } from '../../core/context';
import { notFound } from '../../core/errors';
import { userPreferences, users } from '../../core/db/schema';

export function getPreferences(ctx: AppContext): Preferences {
  const row = ctx.db
    .select({
      displayName: users.displayName,
      locale: userPreferences.locale,
      theme: userPreferences.theme,
      timezone: userPreferences.timezone,
      dailyGoals: userPreferences.dailyGoals,
      streakMinMinutes: userPreferences.streakMinMinutes,
    })
    .from(userPreferences)
    .innerJoin(users, eq(users.id, userPreferences.userId))
    .where(eq(userPreferences.userId, ctx.userId))
    .get();
  if (!row) throw notFound('The local profile');
  return { ...row, dailyGoals: { ...DEFAULT_DAILY_GOALS, ...row.dailyGoals } };
}

export function updatePreferences(ctx: AppContext, patch: UpdatePreferences): Preferences {
  const current = getPreferences(ctx);
  const now = nowIso(ctx);

  ctx.db.transaction((tx) => {
    if (patch.displayName !== undefined) {
      tx.update(users).set({ displayName: patch.displayName }).where(eq(users.id, ctx.userId)).run();
    }
    tx.update(userPreferences)
      .set({
        ...(patch.locale !== undefined ? { locale: patch.locale } : {}),
        ...(patch.theme !== undefined ? { theme: patch.theme } : {}),
        ...(patch.timezone !== undefined ? { timezone: patch.timezone } : {}),
        ...(patch.streakMinMinutes !== undefined ? { streakMinMinutes: patch.streakMinMinutes } : {}),
        ...(patch.dailyGoals !== undefined
          ? { dailyGoals: { ...current.dailyGoals, ...patch.dailyGoals } }
          : {}),
        updatedAt: now,
      })
      .where(eq(userPreferences.userId, ctx.userId))
      .run();
  });

  return getPreferences(ctx);
}
