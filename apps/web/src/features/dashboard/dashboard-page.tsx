import { Button } from '@dlos/ui';
import { Play, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageContainer, PageHeader, QueryBoundary } from '../../components/page';
import { hourInTimeZone, useFormatters } from '../../lib/format';
import { useDashboard } from '../../lib/queries';
import { useOverlayStore } from '../../stores/overlay-store';
import {
  AchievementsCard,
  ActivityCard,
  ContinueCard,
  CurrentWeekCard,
  DailyGoalCard,
  DashboardSkeleton,
  MiniCalendarCard,
  PracticeCard,
  ProjectsCard,
  StatsRow,
  TodayPlanCard,
  WeeklyChartCard,
} from './dashboard-cards';

export function Component() {
  const { t } = useTranslation();
  const format = useFormatters();
  const dashboard = useDashboard();
  const openLogSession = useOverlayStore((state) => state.openLogSession);
  const setTimerDialogOpen = useOverlayStore((state) => state.setTimerDialogOpen);

  const data = dashboard.data;
  const hour = hourInTimeZone(data?.timezone);
  const period = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  const name = data?.profile.displayName;

  return (
    <PageContainer wide>
      <PageHeader
        documentTitle={t('dashboard.title')}
        title={name ? t(`dashboard.greeting.${period}`, { name }) : t('dashboard.title')}
        description={t('dashboard.subtitle')}
        eyebrow={data ? format.date(data.today, { dateStyle: 'full' }) : undefined}
        actions={
          <>
            <Button variant="outline" onClick={() => setTimerDialogOpen(true)}>
              <Play aria-hidden="true" />
              {t('dashboard.startTimer')}
            </Button>
            <Button onClick={() => openLogSession()}>
              <Plus aria-hidden="true" />
              {t('dashboard.logStudy')}
            </Button>
          </>
        }
      />

      <QueryBoundary query={dashboard} skeleton={<DashboardSkeleton />}>
        {(d) => (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
            {d.plan.state === 'upcoming' && d.plan.startDate ? (
              <p className="rounded-xl border border-info/30 bg-info/8 px-4 py-3 text-sm lg:col-span-12">
                {t('dashboard.planUpcoming', {
                  date: format.date(d.plan.startDate),
                  days: d.plan.daysUntilStart ?? 0,
                })}
              </p>
            ) : null}
            {d.plan.state === 'completed' ? (
              <p className="rounded-xl border border-success/30 bg-success/8 px-4 py-3 text-sm lg:col-span-12">
                {t('dashboard.planCompleted')}
              </p>
            ) : null}

            <div className="lg:col-span-7">
              <ContinueCard data={d} />
            </div>
            <div className="lg:col-span-5">
              <PracticeCard data={d} />
            </div>

            <div className="lg:col-span-12">
              <StatsRow data={d} />
            </div>

            <div className="lg:col-span-7">
              <TodayPlanCard data={d} />
            </div>
            <div className="lg:col-span-5">
              <DailyGoalCard data={d} />
            </div>

            <div className="lg:col-span-7">
              <WeeklyChartCard data={d} />
            </div>
            <div className="lg:col-span-5">
              <CurrentWeekCard data={d} />
            </div>

            <div className="lg:col-span-4">
              <ProjectsCard data={d} />
            </div>
            <div className="lg:col-span-4">
              <MiniCalendarCard data={d} />
            </div>
            <div className="lg:col-span-4">
              <ActivityCard data={d} />
            </div>

            <div className="lg:col-span-12">
              <AchievementsCard data={d} />
            </div>
          </div>
        )}
      </QueryBoundary>
    </PageContainer>
  );
}
