import { describe, expect, it } from 'vitest';
import { clockText, hourInTimeZone, parseLocalDate, roundHours } from './format';

describe('format helpers', () => {
  it('parses calendar dates as UTC midnight so the day never shifts', () => {
    expect(parseLocalDate('2026-10-19').toISOString()).toBe('2026-10-19T00:00:00.000Z');
    expect(parseLocalDate('2027-01-01').toISOString()).toBe('2027-01-01T00:00:00.000Z');
  });

  it('formats a stopwatch', () => {
    expect(clockText(0)).toBe('00:00');
    expect(clockText(65)).toBe('01:05');
    expect(clockText(3725)).toBe('1:02:05');
  });

  it('rounds minutes to one decimal of an hour', () => {
    expect(roundHours(90)).toBe(1.5);
    expect(roundHours(100)).toBe(1.7);
    expect(roundHours(0)).toBe(0);
  });

  it('reads the hour in the learner time zone', () => {
    const instant = new Date('2026-10-19T05:00:00Z');
    expect(hourInTimeZone('Asia/Kolkata', instant)).toBe(10);
    expect(hourInTimeZone('America/Los_Angeles', instant)).toBe(22);
    expect(hourInTimeZone('UTC', instant)).toBe(5);
  });

  it('falls back to the browser time zone for invalid input', () => {
    const instant = new Date('2026-10-19T05:00:00Z');
    expect(hourInTimeZone('Not/AZone', instant)).toBe(instant.getHours());
    expect(hourInTimeZone(undefined, instant)).toBe(instant.getHours());
  });
});
