import { describe, expect, it } from 'vitest';
import {
  addDays,
  dayOfWeek,
  diffDays,
  enumerateDates,
  formatLocalDate,
  isValidLocalDate,
  isValidTimeZone,
  monthBounds,
  startOfWeek,
} from './dates';

describe('local date helpers', () => {
  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29');
  });

  it('computes signed differences', () => {
    expect(diffDays('2026-10-17', '2026-10-10')).toBe(7);
    expect(diffDays('2026-10-10', '2026-10-17')).toBe(-7);
  });

  it('finds the start of the week for Monday and Sunday based calendars', () => {
    expect(dayOfWeek('2026-10-17')).toBe(6);
    expect(startOfWeek('2026-10-17', 1)).toBe('2026-10-12');
    expect(startOfWeek('2026-10-17', 0)).toBe('2026-10-11');
    expect(startOfWeek('2026-10-12', 1)).toBe('2026-10-12');
  });

  it('validates calendar dates strictly', () => {
    expect(isValidLocalDate('2026-02-28')).toBe(true);
    expect(isValidLocalDate('2026-02-30')).toBe(false);
    expect(isValidLocalDate('2026-2-3')).toBe(false);
    expect(isValidLocalDate('not-a-date')).toBe(false);
  });

  it('enumerates inclusive ranges and month bounds', () => {
    expect(enumerateDates('2026-10-30', '2026-11-02')).toEqual([
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
      '2026-11-02',
    ]);
    expect(monthBounds('2024-02')).toEqual({ first: '2024-02-01', last: '2024-02-29', days: 29 });
  });

  it('formats the date in the requested time zone', () => {
    const instant = new Date('2026-10-17T20:30:00.000Z');
    expect(formatLocalDate(instant, 'UTC')).toBe('2026-10-17');
    expect(formatLocalDate(instant, 'Asia/Kolkata')).toBe('2026-10-18');
    expect(formatLocalDate(instant, 'America/Los_Angeles')).toBe('2026-10-17');
  });

  it('recognises valid and invalid time zones', () => {
    expect(isValidTimeZone('Asia/Kolkata')).toBe(true);
    expect(isValidTimeZone('Mars/Olympus')).toBe(false);
  });
});
