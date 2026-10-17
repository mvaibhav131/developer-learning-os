import type { CalendarMonth } from '@dlos/shared';
import { Button, Card, CardContent, EmptyState, Skeleton } from '@dlos/ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MonthCalendar } from '../../components/month-calendar';
import { PageContainer, PageHeader, QueryBoundary, SectionCard } from '../../components/page';
import { TrackBadge } from '../../components/badges';
import { useDurationFormatter, useFormatters } from '../../lib/format';
import { useCalendar, useStudySessions } from '../../lib/queries';

function shiftMonth(month: string, delta: number): string {
  const [year = 1970, mon = 1] = month.split('-').map(Number);
  const index = year * 12 + (mon - 1) + delta;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`;
}

function DayDetail({ date, data }: { date: string; data: CalendarMonth }) {
  const { t } = useTranslation();
  const format = useFormatters();
  const duration = useDurationFormatter();
  const sessions = useStudySessions({ from: date, to: date, limit: 50 });
  const day = data.days.find((candidate) => candidate.date === date);

  return (
    <SectionCard
      title={format.date(date, { dateStyle: 'full' })}
      description={t('calendar.selectedDay')}
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground tabular-nums">
          {t('calendar.dayDetail', {
            date: format.date(date, { dateStyle: 'medium' }),
            minutes: format.number(day?.minutes ?? 0),
            done: format.number(day?.tasksCompleted ?? 0),
            total: format.number(day?.tasksScheduled ?? 0),
          })}
        </p>
        {sessions.isPending ? (
          <Skeleton className="h-16 w-full" />
        ) : (sessions.data?.sessions.length ?? 0) === 0 ? (
          <EmptyState title={t('calendar.noStudy')} />
        ) : (
          <ul className="space-y-2">
            {sessions.data?.sessions.map((session) => (
              <li key={session.id} className="flex flex-wrap items-center gap-2 rounded-xl border bg-card/60 p-3 text-sm">
                <TrackBadge track={session.trackSlug} />
                <span className="font-medium">{duration(session.durationMinutes)}</span>
                {session.note ? <span className="min-w-0 text-muted-foreground">{session.note}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </SectionCard>
  );
}

export function Component() {
  const { t } = useTranslation();
  const format = useFormatters();
  const duration = useDurationFormatter();
  const [month, setMonth] = useState<string | undefined>(undefined);
  const [selected, setSelected] = useState<string | undefined>(undefined);
  const calendar = useCalendar(month);

  return (
    <PageContainer>
      <PageHeader title={t('calendar.title')} description={t('calendar.subtitle')} />
      <QueryBoundary
        query={calendar}
        skeleton={
          <div className="grid gap-6 lg:grid-cols-3" aria-hidden="true">
            <Skeleton className="h-[28rem] lg:col-span-2" />
            <Skeleton className="h-64" />
          </div>
        }
      >
        {(data) => {
          const activeDate =
            selected?.startsWith(data.month)
              ? selected
              : data.today.startsWith(data.month)
                ? data.today
                : (data.days[0]?.date ?? `${data.month}-01`);
          return (
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold tracking-tight">{format.monthYear(data.month)}</h2>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon-sm"
                        aria-label={t('calendar.previous')}
                        onClick={() => setMonth(shiftMonth(data.month, -1))}
                      >
                        <ChevronLeft aria-hidden="true" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setMonth(undefined)}>
                        {t('calendar.thisMonth')}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        aria-label={t('calendar.next')}
                        onClick={() => setMonth(shiftMonth(data.month, 1))}
                      >
                        <ChevronRight aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                  <MonthCalendar data={data} selected={activeDate} onSelect={setSelected} />
                  <p className="text-xs text-muted-foreground">{t('calendar.legend')}</p>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <dl className="grid grid-cols-2 gap-3">
                  <Card className="gap-1 px-4 py-4">
                    <dt className="text-sm text-muted-foreground">{t('calendar.totalTime')}</dt>
                    <dd className="text-xl font-semibold tabular-nums">{duration(data.totals.minutes)}</dd>
                  </Card>
                  <Card className="gap-1 px-4 py-4">
                    <dt className="text-sm text-muted-foreground">{t('calendar.activeDays')}</dt>
                    <dd className="text-xl font-semibold tabular-nums">{data.totals.activeDays}</dd>
                  </Card>
                </dl>
                <DayDetail date={activeDate} data={data} />
              </div>
            </div>
          );
        }}
      </QueryBoundary>
    </PageContainer>
  );
}
