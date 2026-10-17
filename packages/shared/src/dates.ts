const LOCAL_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

/** A calendar date without a time zone, formatted as YYYY-MM-DD. */
export type LocalDate = string;

function parse(date: LocalDate): { y: number; m: number; d: number } {
  const match = LOCAL_DATE_RE.exec(date);
  if (!match) throw new RangeError(`Invalid local date: "${date}"`);
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
}

export function toEpochDay(date: LocalDate): number {
  const { y, m, d } = parse(date);
  return Math.floor(Date.UTC(y, m - 1, d) / MS_PER_DAY);
}

export function fromEpochDay(epochDay: number): LocalDate {
  return new Date(epochDay * MS_PER_DAY).toISOString().slice(0, 10);
}

export function isValidLocalDate(date: string): boolean {
  if (!LOCAL_DATE_RE.test(date)) return false;
  return fromEpochDay(toEpochDay(date)) === date;
}

export function addDays(date: LocalDate, days: number): LocalDate {
  return fromEpochDay(toEpochDay(date) + days);
}

/** Whole days from `b` to `a` (positive when `a` is later). */
export function diffDays(a: LocalDate, b: LocalDate): number {
  return toEpochDay(a) - toEpochDay(b);
}

/** 0 = Sunday ... 6 = Saturday. */
export function dayOfWeek(date: LocalDate): number {
  return new Date(toEpochDay(date) * MS_PER_DAY).getUTCDay();
}

export function startOfWeek(date: LocalDate, weekStartsOn: 0 | 1 = 1): LocalDate {
  const delta = (dayOfWeek(date) - weekStartsOn + 7) % 7;
  return addDays(date, -delta);
}

export function enumerateDates(from: LocalDate, to: LocalDate): LocalDate[] {
  const dates: LocalDate[] = [];
  for (let day = toEpochDay(from); day <= toEpochDay(to); day += 1) dates.push(fromEpochDay(day));
  return dates;
}

export function monthBounds(month: string): { first: LocalDate; last: LocalDate; days: number } {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) throw new RangeError(`Invalid month: "${month}"`);
  const y = Number(match[1]);
  const m = Number(match[2]);
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const first = `${match[1]}-${match[2]}-01`;
  const last = `${match[1]}-${match[2]}-${String(days).padStart(2, '0')}`;
  return { first, last, days };
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** The calendar date `instant` falls on inside `timeZone`. */
export function formatLocalDate(instant: Date, timeZone: string): LocalDate {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant);
  const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return `${pick('year').padStart(4, '0')}-${pick('month')}-${pick('day')}`;
}
