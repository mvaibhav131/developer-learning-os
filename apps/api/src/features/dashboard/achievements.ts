import type { AchievementKey } from '@dlos/shared';

export interface AchievementFacts {
  totalSessions: number;
  totalMinutes: number;
  completedTasks: number;
  longestStreak: number;
  hasBalancedDay: boolean;
  hasPerfectWeek: boolean;
}

export interface AchievementState {
  key: AchievementKey;
  unlocked: boolean;
  current: number;
  target: number;
}

function progress(key: AchievementKey, current: number, target: number): AchievementState {
  return { key, current: Math.min(current, target), target, unlocked: current >= target };
}

/** Achievements are computed from persisted records on every request; nothing is stored or faked. */
export function evaluateAchievements(facts: AchievementFacts): AchievementState[] {
  const hours = Math.floor((facts.totalMinutes / 60) * 10) / 10;
  return [
    progress('first-session', facts.totalSessions, 1),
    progress('first-task', facts.completedTasks, 1),
    progress('streak-3', facts.longestStreak, 3),
    progress('streak-7', facts.longestStreak, 7),
    progress('streak-30', facts.longestStreak, 30),
    progress('hours-10', hours, 10),
    progress('hours-50', hours, 50),
    progress('hours-100', hours, 100),
    progress('balanced-day', facts.hasBalancedDay ? 1 : 0, 1),
    progress('perfect-week', facts.hasPerfectWeek ? 1 : 0, 1),
  ];
}
