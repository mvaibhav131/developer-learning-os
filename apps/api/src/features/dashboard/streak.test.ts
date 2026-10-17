import { describe, expect, it } from 'vitest';
import { computeStreak } from './streak';
import { evaluateAchievements } from './achievements';

const days = (entries: Record<string, number>) => new Map(Object.entries(entries));

describe('computeStreak', () => {
  it('returns zeros when nothing was studied', () => {
    expect(computeStreak(new Map(), '2026-10-19', 10)).toEqual({
      current: 0,
      longest: 0,
      lastActiveDate: null,
      todayCounts: false,
    });
  });

  it('counts consecutive qualifying days ending today', () => {
    const result = computeStreak(
      days({ '2026-10-17': 30, '2026-10-18': 15, '2026-10-19': 10 }),
      '2026-10-19',
      10,
    );
    expect(result).toMatchObject({ current: 3, longest: 3, todayCounts: true });
  });

  it('keeps the streak alive until the end of today', () => {
    const result = computeStreak(days({ '2026-10-17': 30, '2026-10-18': 30 }), '2026-10-19', 10);
    expect(result).toMatchObject({ current: 2, longest: 2, todayCounts: false });
  });

  it('breaks the streak after a missed day and remembers the longest run', () => {
    const result = computeStreak(
      days({
        '2026-10-10': 20,
        '2026-10-11': 20,
        '2026-10-12': 20,
        '2026-10-13': 20,
        '2026-10-17': 20,
      }),
      '2026-10-19',
      10,
    );
    expect(result).toMatchObject({ current: 0, longest: 4, lastActiveDate: '2026-10-17' });
  });

  it('ignores days below the minimum threshold and future dates', () => {
    const result = computeStreak(
      days({ '2026-10-18': 5, '2026-10-19': 9, '2026-10-20': 60 }),
      '2026-10-19',
      10,
    );
    expect(result).toMatchObject({ current: 0, longest: 0, lastActiveDate: null });
  });
});

describe('evaluateAchievements', () => {
  const none = {
    totalSessions: 0,
    totalMinutes: 0,
    completedTasks: 0,
    longestStreak: 0,
    hasBalancedDay: false,
    hasPerfectWeek: false,
  };

  it('locks everything for a brand new learner', () => {
    expect(evaluateAchievements(none).every((item) => !item.unlocked)).toBe(true);
  });

  it('unlocks from real facts and caps progress at the target', () => {
    const states = evaluateAchievements({
      ...none,
      totalSessions: 4,
      totalMinutes: 11 * 60,
      completedTasks: 9,
      longestStreak: 8,
    });
    const byKey = Object.fromEntries(states.map((state) => [state.key, state]));
    expect(byKey['first-session']?.unlocked).toBe(true);
    expect(byKey['first-task']?.unlocked).toBe(true);
    expect(byKey['streak-7']?.unlocked).toBe(true);
    expect(byKey['streak-30']).toMatchObject({ unlocked: false, current: 8, target: 30 });
    expect(byKey['hours-10']?.unlocked).toBe(true);
    expect(byKey['hours-50']?.unlocked).toBe(false);
    expect(byKey['perfect-week']?.unlocked).toBe(false);
  });
});
