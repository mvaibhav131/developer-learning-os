import { TRACK_SLUGS, type AchievementKey, type ActivityType, type Dashboard } from '@dlos/shared';
import {
  Badge,
  Button,
  EmptyState,
  ProgressBar,
  ProgressRing,
  Skeleton,
  cn,
} from '@dlos/ui';
import {
  ArrowRight,
  Award,
  BookCheck,
  CalendarCheck,
  CircleCheck,
  Clock,
  CodeXml,
  Flame,
  History,
  ListChecks,
  Play,
  Scale,
  Target,
  Trophy,
  type LucideIcon,
} from 'lucide-react';
import { Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { TrackBadge } from '../../components/badges';
import { MonthCalendar } from '../../components/month-calendar';
import { SectionCard, StatTile } from '../../components/page';
import { PlanTaskRow } from '../../components/plan-task-row';
import { roundHours, useFormatters } from '../../lib/format';
import { useCalendar } from '../../lib/queries';
import { TRACK_STYLE } from '../../lib/tracks';
import { useOverlayStore } from '../../stores/overlay-store';

const WeeklyChart = lazy(() => import('./weekly-chart'));

type Props = { data: Dashboard };

export function TodayPlanCard({ data }: Props) {
  const { t } = useTranslation();
  const { plan, todayTasks } = data;
  const coreToday = todayTasks.filter((task) => !task.isOptional);
  const allDone = coreToday.length > 0 && coreToday.every((task) => task.completedAt);
  const dayNumber = todayTasks[0] ? todayTasks[0].dayOffset + 1 : null;

  return (
    <SectionCard
      title={t('dashboard.today.title')}
      icon={ListChecks}
      action={
        plan.currentWeek ? (
          <Badge variant="outline">
            {t('common.week', { n: plan.currentWeek })}
            {dayNumber ? ` · ${t('common.day', { n: dayNumber })}` : ''}
          </Badge>
        ) : null
      }
      className="h-full"
    >
      {todayTasks.length === 0 ? (
        <EmptyState
          title={t('dashboard.today.empty')}
          action={
            <Button asChild variant="outline" size="sm">
              <Link to="/roadmap">{t('dashboard.week.open')}</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          <ul className="space-y-2">
            {todayTasks.map((task) => (
              <PlanTaskRow key={task.id} task={task} />
            ))}
          </ul>
          {allDone ? (
            <p className="flex items-center gap-2 text-sm text-success">
              <CircleCheck aria-hidden="true" className="size-4" />
              {t('dashboard.today.allDone')}
            </p>
          ) : null}
        </div>
      )}
    </SectionCard>
  );
}

export function DailyGoalCard({ data }: Props) {
  const { t } = useTranslation();
  const format = useFormatters();
  const openLogSession = useOverlayStore((state) => state.openLogSession);
  const { daily } = data;
  const met = daily.targetMinutes > 0 && daily.studiedMinutes >= daily.targetMinutes;

  return (
    <SectionCard
      title={t('dashboard.daily.title')}
      description={t('dashboard.daily.hint')}
      icon={Target}
      className="h-full"
    >
      <div className="flex flex-col items-center gap-5 sm:flex-row">
        <ProgressRing value={daily.percent} label={t('dashboard.daily.ringLabel')} size={120} strokeWidth={10}>
          <div>
            <p className="text-2xl font-semibold tabular-nums">{daily.percent}%</p>
            {met ? (
              <p className="text-xs font-medium text-success">{t('dashboard.daily.goalMet')}</p>
            ) : null}
          </div>
        </ProgressRing>
        <div className="w-full min-w-0 flex-1 space-y-3">
          <p className="text-sm text-muted-foreground tabular-nums">
            {t('dashboard.daily.studied', {
              studied: format.number(daily.studiedMinutes),
              target: format.number(daily.targetMinutes),
            })}
          </p>
          <ul className="space-y-2.5">
            {daily.byTrack.map((row) => {
              const percent = row.targetMinutes > 0 ? (row.studiedMinutes / row.targetMinutes) * 100 : 100;
              return (
                <li key={row.trackSlug} className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className={cn('font-medium', TRACK_STYLE[row.trackSlug].text)}>
                      {t(`tracks.${row.trackSlug}`)}
                    </span>
                    <span className="text-muted-foreground tabular-nums">
                      {row.studiedMinutes}/{row.targetMinutes}
                    </span>
                  </div>
                  <ProgressBar
                    value={percent}
                    label={t(`tracks.${row.trackSlug}`)}
                    className="h-1.5"
                    indicatorClassName={TRACK_STYLE[row.trackSlug].bar}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <Button className="mt-5 w-full sm:w-auto" onClick={() => openLogSession()}>
        {t('dashboard.logStudy')}
      </Button>
    </SectionCard>
  );
}

export function StatsRow({ data }: Props) {
  const { t } = useTranslation();
  const format = useFormatters();
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      <StatTile
        icon={Flame}
        label={t('dashboard.stats.streak')}
        value={format.number(data.streak.current)}
        hint={t('dashboard.stats.streakHint', {
          best: format.number(data.streak.longest),
          min: data.streak.minMinutes,
        })}
        accentClassName="bg-warning/15 text-warning"
      />
      <StatTile
        icon={Clock}
        label={t('dashboard.stats.week')}
        value={format.number(roundHours(data.weekly.totalMinutes), { maximumFractionDigits: 1 })}
        hint={t('dashboard.stats.weekHint', {
          target: format.number(roundHours(data.weekly.targetMinutes), { maximumFractionDigits: 1 }),
        })}
      />
      <StatTile
        icon={BookCheck}
        label={t('dashboard.stats.lessons')}
        value={format.number(data.lessons.completed)}
        hint={t('dashboard.stats.lessonsHint', {
          authored: format.number(data.lessons.authoredTotal),
          catalog: format.number(data.lessons.catalogTotal),
        })}
        accentClassName="bg-success/12 text-success"
      />
      <StatTile
        icon={CodeXml}
        label={t('dashboard.stats.problems')}
        value={format.number(data.practice.solved)}
        hint={t('dashboard.stats.problemsHint', { total: format.number(data.practice.total) })}
        accentClassName="bg-info/12 text-info"
      />
    </div>
  );
}

export function WeeklyChartCard({ data }: Props) {
  const { t } = useTranslation();
  const format = useFormatters();
  const { weekly } = data;
  const empty = weekly.totalMinutes === 0;
  const summary = weekly.days
    .map((day) => `${format.weekday(day.date, 'short')} ${day.minutes}`)
    .join(', ');

  return (
    <SectionCard
      title={t('dashboard.weekly.title')}
      description={t('dashboard.weekly.description')}
      icon={Clock}
      className="h-full"
    >
      {empty ? (
        <EmptyState title={t('dashboard.weekly.empty')} className="h-60" />
      ) : (
        <div role="img" aria-label={t('dashboard.weekly.summary', { summary })}>
          <Suspense fallback={<Skeleton className="h-60 w-full" />}>
            <WeeklyChart days={weekly.days} />
          </Suspense>
        </div>
      )}
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        {TRACK_SLUGS.map((slug) => (
          <li key={slug} className="flex items-center gap-1.5">
            <span className={cn('size-2.5 rounded-full', TRACK_STYLE[slug].bar)} aria-hidden="true" />
            {t(`tracks.${slug}`)}
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

export function CurrentWeekCard({ data }: Props) {
  const { t } = useTranslation();
  const format = useFormatters();
  const { plan } = data;
  const week = plan.week;

  return (
    <SectionCard
      title={t('dashboard.week.title')}
      icon={CalendarCheck}
      action={
        <Button asChild variant="ghost" size="sm">
          <Link to={week ? `/roadmap?week=${week.weekNumber}` : '/roadmap'}>
            {t('dashboard.week.open')}
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      }
      className="h-full"
    >
      {week ? (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Badge variant="default">
              {t('common.week', { n: week.weekNumber })} · {week.phaseTitle}
            </Badge>
            <h4 className="leading-snug font-semibold">{week.title}</h4>
          </div>
          <div className="space-y-1.5">
            <ProgressBar
              value={week.coreTasks > 0 ? (week.coreCompleted / week.coreTasks) * 100 : 0}
              label={t('dashboard.week.progress', { done: week.coreCompleted, total: week.coreTasks })}
            />
            <p className="text-xs text-muted-foreground tabular-nums">
              {t('dashboard.week.progress', {
                done: format.number(week.coreCompleted),
                total: format.number(week.coreTasks),
              })}
              {' · '}
              {t('dashboard.week.optional', {
                done: format.number(week.optionalCompleted),
                total: format.number(week.optionalTasks),
              })}
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {t('dashboard.week.goals')}
            </p>
            <ul className="space-y-1.5 text-sm">
              {week.goals.map((goal) => (
                <li key={goal} className="flex gap-2">
                  <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{goal}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="rounded-lg bg-muted px-3 py-2 text-sm">
            <span className="font-medium">{t('dashboard.week.deliverable')}: </span>
            {week.deliverable}
          </p>
        </div>
      ) : (
        <EmptyState
          title={
            plan.state === 'upcoming' && plan.startDate
              ? t('dashboard.planUpcoming', {
                  date: format.date(plan.startDate),
                  days: plan.daysUntilStart ?? 0,
                })
              : t('dashboard.planCompleted')
          }
        />
      )}
    </SectionCard>
  );
}

export function ContinueCard({ data }: Props) {
  const { t } = useTranslation();
  const lesson = data.continueLesson;

  return (
    <SectionCard title={t('dashboard.continue.title')} icon={Play} className="h-full">
      {lesson ? (
        <div className="flex h-full flex-col gap-4">
          <div className="space-y-2 rounded-xl bg-linear-to-br from-accent to-card p-4 ring-1 ring-border">
            <div className="flex flex-wrap items-center gap-2">
              <TrackBadge track={lesson.trackSlug} />
              <Badge variant="outline">{t(`dashboard.continue.reason.${lesson.reason}`)}</Badge>
            </div>
            <p className="text-lg leading-snug font-semibold">{lesson.title}</p>
            <p className="text-sm text-muted-foreground">
              {lesson.courseTitle} · {t('common.minutes', { value: lesson.minutes })}
              {lesson.hasVideo ? ` · ${t('dashboard.continue.withVideo')}` : ''}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link to={`/lessons/${lesson.slug}`}>
                {lesson.reason === 'resume' ? t('dashboard.continue.resume') : t('dashboard.continue.start')}
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/learn">{t('dashboard.continue.browse')}</Link>
            </Button>
          </div>
        </div>
      ) : (
        <EmptyState
          title={t('dashboard.continue.empty')}
          action={
            <Button asChild size="sm" variant="outline">
              <Link to="/learn">{t('dashboard.continue.browse')}</Link>
            </Button>
          }
        />
      )}
    </SectionCard>
  );
}

export function PracticeCard({ data }: Props) {
  const { t } = useTranslation();
  const { practice } = data;
  return (
    <SectionCard title={t('dashboard.practice.title')} icon={CodeXml} className="h-full">
      {practice.total === 0 ? (
        <EmptyState title={t('dashboard.practice.empty')} />
      ) : (
        <div className="flex h-full flex-col gap-4">
          <div className="space-y-2">
            <p className="text-3xl font-semibold tabular-nums">
              {t('practice.solvedOf', { solved: practice.solved, total: practice.total })}
            </p>
            <ProgressBar value={(practice.solved / practice.total) * 100} label={t('dashboard.practice.title')} className="h-2" />
            <p className="text-sm text-muted-foreground">{t('dashboard.practice.attempted', { value: practice.attempted })}</p>
          </div>
          <Button asChild className="mt-auto w-fit">
            <Link to="/practice">
              {t('dashboard.practice.open')}
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      )}
    </SectionCard>
  );
}

export function ProjectsCard({ data }: Props) {
  const { t } = useTranslation();
  const format = useFormatters();
  const { projects } = data;
  return (
    <SectionCard
      title={t('dashboard.projects.title')}
      icon={Award}
      action={
        <Button asChild variant="ghost" size="sm">
          <Link to="/projects">
            {t('dashboard.projects.open')}
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      }
      className="h-full"
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <ProgressBar
            value={projects.milestonesTotal > 0 ? (projects.milestonesDone / projects.milestonesTotal) * 100 : 0}
            label={t('dashboard.projects.title')}
          />
          <p className="text-xs text-muted-foreground tabular-nums">
            {t('dashboard.projects.summary', {
              started: format.number(projects.started),
              total: format.number(projects.total),
            })}
            {' · '}
            {t('dashboard.projects.milestones', {
              done: format.number(projects.milestonesDone),
              total: format.number(projects.milestonesTotal),
            })}
          </p>
        </div>
        {projects.active.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('dashboard.projects.empty')}</p>
        ) : (
          <ul className="space-y-2">
            {projects.active.map((project) => (
              <li key={project.slug}>
                <Link to={`/projects/${project.slug}`} className="text-sm font-medium hover:underline">
                  {project.title}
                </Link>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {t('projects.milestonesDone', {
                    done: project.milestonesDone,
                    total: project.milestonesTotal,
                  })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SectionCard>
  );
}

export function MiniCalendarCard({ data }: Props) {
  const { t } = useTranslation();
  const format = useFormatters();
  const month = data.today.slice(0, 7);
  const calendar = useCalendar(month);
  return (
    <SectionCard
      title={t('dashboard.calendar.title')}
      description={format.monthYear(month)}
      icon={CalendarCheck}
      action={
        <Button asChild variant="ghost" size="sm">
          <Link to="/calendar">
            {t('dashboard.calendar.open')}
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      }
      className="h-full"
    >
      {calendar.data ? (
        <MonthCalendar data={calendar.data} compact />
      ) : (
        <Skeleton className="h-52 w-full" />
      )}
    </SectionCard>
  );
}

const ACHIEVEMENT_ICON: Record<AchievementKey, LucideIcon> = {
  'first-session': Play,
  'first-task': CircleCheck,
  'streak-3': Flame,
  'streak-7': Flame,
  'streak-30': Flame,
  'hours-10': Clock,
  'hours-50': Clock,
  'hours-100': Clock,
  'balanced-day': Scale,
  'perfect-week': Trophy,
};

export function AchievementsCard({ data }: Props) {
  const { t } = useTranslation();
  const format = useFormatters();
  const unlocked = data.achievements.filter((item) => item.unlocked).length;
  return (
    <SectionCard
      title={t('dashboard.achievements.title')}
      description={t('dashboard.achievements.unlocked', {
        done: unlocked,
        total: data.achievements.length,
      })}
      icon={Trophy}
      className="h-full"
    >
      <ul className="grid gap-3 sm:grid-cols-2">
        {data.achievements.map((item) => {
          const Icon = ACHIEVEMENT_ICON[item.key];
          return (
            <li
              key={item.key}
              className={cn(
                'flex items-start gap-3 rounded-xl border p-3',
                item.unlocked ? 'border-success/30 bg-success/5' : 'bg-card',
              )}
            >
              <span
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-xl',
                  item.unlocked ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground',
                )}
              >
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm leading-snug font-medium">{t(`achievements.${item.key}.title`)}</p>
                <p className="text-xs text-muted-foreground">{t(`achievements.${item.key}.description`)}</p>
                <ProgressBar
                  value={(item.current / item.target) * 100}
                  label={t(`achievements.${item.key}.title`)}
                  className="h-1"
                  indicatorClassName={item.unlocked ? 'bg-success' : undefined}
                />
                <p className="text-[0.6875rem] text-muted-foreground tabular-nums">
                  {format.number(item.current, { maximumFractionDigits: 1 })} / {format.number(item.target)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}

const ACTIVITY_ICON: Record<ActivityType, LucideIcon> = {
  study_session: Clock,
  task_completed: CircleCheck,
  lesson_completed: BookCheck,
  problem_solved: CodeXml,
  plan_started: CalendarCheck,
  plan_reset: History,
};

export function ActivityCard({ data }: Props) {
  const { t } = useTranslation();
  const format = useFormatters();
  return (
    <SectionCard title={t('dashboard.activity.title')} icon={History} className="h-full">
      {data.recentActivity.length === 0 ? (
        <EmptyState title={t('dashboard.activity.empty')} />
      ) : (
        <ul className="space-y-3">
          {data.recentActivity.map((event) => {
            const Icon = ACTIVITY_ICON[event.type];
            return (
              <li key={event.id} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Icon aria-hidden="true" className="size-4" />
                </span>
                <div className="min-w-0 text-sm">
                  <p className="leading-snug font-medium">
                    {t(`activity.${event.type}`, { minutes: event.minutes ?? 0 })}
                    {event.trackSlug ? ` · ${t(`tracks.${event.trackSlug}`)}` : ''}
                  </p>
                  {event.title ? (
                    <p className="truncate text-xs text-muted-foreground">{event.title}</p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">{format.dateTime(event.occurredAt)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-12 lg:gap-6" aria-hidden="true">
      <Skeleton className="h-72 lg:col-span-7" />
      <Skeleton className="h-72 lg:col-span-5" />
      <div className="grid grid-cols-2 gap-3 lg:col-span-12 lg:grid-cols-4 lg:gap-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-80 lg:col-span-7" />
      <Skeleton className="h-80 lg:col-span-5" />
    </div>
  );
}
