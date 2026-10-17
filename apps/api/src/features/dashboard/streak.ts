import { addDays, diffDays } from '@dlos/shared';

export interface StreakResult {
  current: number;
  longest: number;
  lastActiveDate: string | null;
  todayCounts: boolean;
}

/**
 * A day counts when at least `minMinutes` were studied. The current streak stays alive through
 * today: if today has no qualifying study yet, it is measured up to yesterday.
 */
export function computeStreak(
  minutesByDate: ReadonlyMap<string, number>,
  today: string,
  minMinutes: number,
): StreakResult {
  const active = [...minutesByDate.entries()]
    .filter(([date, minutes]) => minutes >= minMinutes && date <= today)
    .map(([date]) => date)
    .sort();

  let longest = 0;
  let run = 0;
  let previous: string | null = null;
  for (const date of active) {
    run = previous !== null && diffDays(date, previous) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = date;
  }

  const activeSet = new Set(active);
  const todayCounts = activeSet.has(today);
  let cursor = todayCounts ? today : addDays(today, -1);
  let current = 0;
  while (activeSet.has(cursor)) {
    current += 1;
    cursor = addDays(cursor, -1);
  }

  return { current, longest, lastActiveDate: active.at(-1) ?? null, todayCounts };
}
