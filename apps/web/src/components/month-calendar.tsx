import { addDays, dayOfWeek, startOfWeek, type CalendarMonth } from '@dlos/shared';
import { cn } from '@dlos/ui';
import { useTranslation } from 'react-i18next';
import { useFormatters } from '../lib/format';

function intensity(minutes: number): string {
  if (minutes >= 120) return 'bg-primary text-primary-foreground hover:bg-primary/90';
  if (minutes >= 60) return 'bg-primary/40 hover:bg-primary/50';
  if (minutes >= 30) return 'bg-primary/25 hover:bg-primary/35';
  if (minutes > 0) return 'bg-primary/12 hover:bg-primary/20';
  return 'hover:bg-accent';
}

export function MonthCalendar({
  data,
  compact = false,
  selected,
  onSelect,
}: {
  data: CalendarMonth;
  compact?: boolean;
  selected?: string;
  onSelect?: (date: string) => void;
}) {
  const { t } = useTranslation();
  const format = useFormatters();
  const firstDate = data.days[0]?.date ?? `${data.month}-01`;
  const offset = (dayOfWeek(firstDate) - data.weekStartsOn + 7) % 7;
  const referenceWeek = startOfWeek(firstDate, data.weekStartsOn);

  const cells = [...Array<null>(offset).fill(null), ...data.days];
  while (cells.length % 7 !== 0) cells.push(null);
  const rows = Array.from({ length: cells.length / 7 }, (_, index) =>
    cells.slice(index * 7, index * 7 + 7),
  );

  return (
    <table className="w-full table-fixed border-separate border-spacing-1 text-center">
      <caption className="sr-only">{format.monthYear(data.month)}</caption>
      <thead>
        <tr>
          {Array.from({ length: 7 }, (_, index) => {
            const date = addDays(referenceWeek, index);
            return (
              <th
                key={date}
                scope="col"
                abbr={format.weekday(date, 'long')}
                className="pb-1 text-xs font-medium text-muted-foreground"
              >
                {format.weekday(date, 'short')}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((day, cellIndex) => {
              if (!day) return <td key={`empty-${cellIndex}`} />;
              const isToday = day.date === data.today;
              const label = t('calendar.dayDetail', {
                date: format.date(day.date, { dateStyle: 'full' }),
                minutes: format.number(day.minutes),
                done: format.number(day.tasksCompleted),
                total: format.number(day.tasksScheduled),
              });
              const classes = cn(
                'relative flex w-full flex-col items-center justify-center rounded-lg text-sm tabular-nums outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/40',
                compact ? 'aspect-square' : 'min-h-11 py-1.5 sm:min-h-16',
                intensity(day.minutes),
                isToday && 'border-2 border-primary font-semibold',
                day.goalMet && 'ring-2 ring-success ring-offset-1 ring-offset-card',
                selected === day.date && 'outline-2 outline-offset-2 outline-ring',
              );
              const content = (
                <>
                  <span>{Number(day.date.slice(8))}</span>
                  {!compact && day.minutes > 0 ? (
                    <span className="hidden text-[0.65rem] leading-none opacity-80 sm:block">
                      {t('common.minutes', { value: format.number(day.minutes) })}
                    </span>
                  ) : null}
                </>
              );
              return (
                <td key={day.date} className="p-0">
                  {onSelect ? (
                    <button
                      type="button"
                      className={classes}
                      aria-label={label}
                      aria-pressed={selected === day.date}
                      aria-current={isToday ? 'date' : undefined}
                      onClick={() => onSelect(day.date)}
                    >
                      {content}
                    </button>
                  ) : (
                    <div
                      className={classes}
                      title={label}
                      role="img"
                      aria-label={label}
                      aria-current={isToday ? 'date' : undefined}
                    >
                      {content}
                    </div>
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
