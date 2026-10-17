import { TRACK_SLUGS, enumerateDates, monthBounds, type CalendarMonth } from '@dlos/shared';
import { todayIn, type AppContext } from '../../core/context';
import { loadTaskRows, requirePlan, toTaskDto } from '../plan/plan.service';
import { getPreferences } from '../preferences/preferences.service';
import { WEEK_STARTS_ON, loadSessionDays } from '../dashboard/dashboard.service';

export function getCalendarMonth(ctx: AppContext, month?: string): CalendarMonth {
  const prefs = getPreferences(ctx);
  const today = todayIn(ctx, prefs.timezone);
  const target = month ?? today.slice(0, 7);
  const { first, last } = monthBounds(target);

  const plan = requirePlan(ctx);
  const coreTasks = loadTaskRows(ctx, plan.id)
    .map((row) => toTaskDto(plan, row))
    .filter((task) => !task.isOptional && task.scheduledDate >= first && task.scheduledDate <= last);

  const sessionDays = loadSessionDays(ctx);
  const dailyTarget = TRACK_SLUGS.reduce((sum, slug) => sum + prefs.dailyGoals[slug], 0);

  const days = enumerateDates(first, last).map((date) => {
    const studied = sessionDays.get(date);
    const dayTasks = coreTasks.filter((task) => task.scheduledDate === date);
    const minutes = studied?.minutes ?? 0;
    return {
      date,
      minutes,
      sessions: studied?.sessions ?? 0,
      tasksScheduled: dayTasks.length,
      tasksCompleted: dayTasks.filter((task) => task.completedAt).length,
      goalMet: dailyTarget > 0 && minutes >= dailyTarget,
    };
  });

  return {
    month: target,
    today,
    weekStartsOn: WEEK_STARTS_ON,
    days,
    totals: {
      minutes: days.reduce((sum, day) => sum + day.minutes, 0),
      activeDays: days.filter((day) => day.minutes > 0).length,
    },
  };
}
