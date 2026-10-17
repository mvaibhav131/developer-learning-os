import { useTranslation } from 'react-i18next';
import { INTL_LOCALE } from './i18n';
import { useUiStore } from '../stores/ui-store';

/** Parses a YYYY-MM-DD calendar date as UTC midnight so time zones never shift the day. */
export function parseLocalDate(date: string): Date {
  const [year = 1970, month = 1, day = 1] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function useIntlLocale(): string {
  const locale = useUiStore((state) => state.locale);
  return INTL_LOCALE[locale];
}

export function useFormatters() {
  const intlLocale = useIntlLocale();
  return {
    date: (date: string, options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }) =>
      new Intl.DateTimeFormat(intlLocale, { ...options, timeZone: 'UTC' }).format(
        parseLocalDate(date),
      ),
    number: (value: number, options?: Intl.NumberFormatOptions) =>
      new Intl.NumberFormat(intlLocale, options).format(value),
    dateTime: (iso: string) =>
      new Intl.DateTimeFormat(intlLocale, { dateStyle: 'medium', timeStyle: 'short' }).format(
        new Date(iso),
      ),
    weekday: (date: string, style: 'short' | 'long' = 'short') =>
      new Intl.DateTimeFormat(intlLocale, { weekday: style, timeZone: 'UTC' }).format(
        parseLocalDate(date),
      ),
    monthYear: (month: string) =>
      new Intl.DateTimeFormat(intlLocale, {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(parseLocalDate(`${month}-01`)),
  };
}

/** 90 -> "1 h 30 min" using the active interface language. */
export function useDurationFormatter() {
  const { t } = useTranslation();
  const { number } = useFormatters();
  return (totalMinutes: number): string => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    const parts: string[] = [];
    if (hours > 0) parts.push(t('common.hours', { value: number(hours) }));
    if (minutes > 0 || hours === 0) parts.push(t('common.minutes', { value: number(minutes) }));
    return parts.join(' ');
  };
}

export const roundHours = (minutes: number): number => Math.round((minutes / 60) * 10) / 10;

/** Current hour (0-23) in an IANA time zone; falls back to the browser time zone. */
export function hourInTimeZone(timeZone: string | undefined, now: Date = new Date()): number {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      hourCycle: 'h23',
      ...(timeZone ? { timeZone } : {}),
    }).formatToParts(now);
    const hour = Number(parts.find((part) => part.type === 'hour')?.value);
    return Number.isInteger(hour) ? hour : now.getHours();
  } catch {
    return now.getHours();
  }
}

export function clockText(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => String(value).padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}
