import { ROADMAP_WEEK_COUNT, diffDays, type PlanOverview, type PlanTask, type PlanWeekSummary } from '@dlos/shared';
import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  Input,
  Label,
  ProgressBar,
  ProgressRing,
  Skeleton,
  cn,
  toast,
} from '@dlos/ui';
import { ChevronDown, Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { PlanTaskRow } from '../../components/plan-task-row';
import { PageContainer, PageHeader, QueryBoundary } from '../../components/page';
import { useFormatters } from '../../lib/format';
import {
  useDeletePlanTask,
  usePlan,
  usePlanWeek,
  useUpdatePlan,
  useUpdatePlanTask,
} from '../../lib/queries';
import { ConfirmDialog, TaskDialog } from './task-dialogs';

function StartDateControl({ overview }: { overview: PlanOverview }) {
  const { t } = useTranslation();
  const update = useUpdatePlan();
  const [value, setValue] = useState(overview.plan.startDate);
  const dirty = value !== overview.plan.startDate && value !== '';

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-end gap-2">
        <div className="grid gap-1.5">
          <Label htmlFor="plan-start">{t('roadmap.startDate')}</Label>
          <Input
            id="plan-start"
            type="date"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className="w-44"
          />
        </div>
        <Button
          variant="outline"
          disabled={!dirty || update.isPending}
          onClick={() =>
            update.mutate(
              { startDate: value },
              {
                onSuccess: () => toast.success(t('settings.plan.moved')),
                onError: () => toast.error(t('settings.saveFailed')),
              },
            )
          }
        >
          {t('common.save')}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{t('roadmap.startHint')}</p>
    </div>
  );
}

function PlanSummary({ overview }: { overview: PlanOverview }) {
  const { t } = useTranslation();
  const format = useFormatters();
  const { totals } = overview;
  const percent = totals.coreTasks > 0 ? Math.round((totals.coreCompleted / totals.coreTasks) * 100) : 0;
  const status =
    overview.state === 'upcoming'
      ? t('roadmap.startUpcoming', { days: overview.daysUntilStart ?? 0 })
      : overview.state === 'completed'
        ? t('roadmap.startCompleted')
        : t('roadmap.startActive', { week: overview.currentWeek ?? 1, total: ROADMAP_WEEK_COUNT });

  return (
    <Card>
      <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <ProgressRing value={percent} label={t('roadmap.progress')} size={104} strokeWidth={9}>
          <span className="text-xl font-semibold tabular-nums">{percent}%</span>
        </ProgressRing>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm text-muted-foreground">{overview.plan.name}</p>
          <p className="text-xl font-semibold tracking-tight">{status}</p>
          <p className="text-sm text-muted-foreground tabular-nums">
            {t('roadmap.progress')}:{' '}
            {t('common.ofTotal', {
              done: format.number(totals.coreCompleted),
              total: format.number(totals.coreTasks),
            })}
          </p>
          <p className="text-xs text-muted-foreground">
            {format.date(overview.plan.startDate)} – {format.date(overview.plan.endDate)}
          </p>
        </div>
        <StartDateControl key={overview.plan.startDate} overview={overview} />
      </CardContent>
    </Card>
  );
}

function PhaseStrip({
  overview,
  onOpenWeek,
}: {
  overview: PlanOverview;
  onOpenWeek: (week: number) => void;
}) {
  const { t } = useTranslation();
  return (
    <section aria-labelledby="phases-heading" className="space-y-3">
      <h2 id="phases-heading" className="text-lg font-semibold tracking-tight">
        {t('roadmap.phases')}
      </h2>
      <ol className="scrollbar-thin -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {overview.phases.map((phase, index) => {
          const current =
            overview.currentWeek !== null &&
            overview.currentWeek >= phase.weekStart &&
            overview.currentWeek <= phase.weekEnd;
          const percent =
            phase.totals.coreTasks > 0 ? (phase.totals.coreCompleted / phase.totals.coreTasks) * 100 : 0;
          return (
            <li key={phase.key} className="w-64 shrink-0 snap-start">
              <button
                type="button"
                onClick={() => onOpenWeek(phase.weekStart)}
                className={cn(
                  'flex h-full w-full flex-col gap-2 rounded-2xl border bg-card p-4 text-left shadow-card outline-none transition-colors hover:bg-accent/40 focus-visible:ring-[3px] focus-visible:ring-ring/40',
                  current && 'border-primary/50 ring-1 ring-primary/30',
                )}
              >
                <span className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>
                    {index + 1}. {t('common.week', { n: `${phase.weekStart}–${phase.weekEnd}` })}
                  </span>
                  {current ? <Badge>{t('roadmap.current')}</Badge> : null}
                </span>
                <span className="font-semibold">{phase.title}</span>
                <ProgressBar value={percent} label={phase.title} className="mt-auto h-1.5" />
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function WeekBody({
  week,
  overview,
  onAdd,
  onEdit,
  onDelete,
  onMoveToday,
}: {
  week: PlanWeekSummary;
  overview: PlanOverview;
  onAdd: (defaultDate: string) => void;
  onEdit: (task: PlanTask) => void;
  onDelete: (task: PlanTask) => void;
  onMoveToday: (task: PlanTask) => void;
}) {
  const { t } = useTranslation();
  const format = useFormatters();
  const detail = usePlanWeek(week.weekNumber);

  if (detail.isPending) return <Skeleton className="h-64 w-full" />;
  if (detail.isError || !detail.data) {
    return (
      <Button variant="outline" onClick={() => void detail.refetch()}>
        {t('common.retry')}
      </Button>
    );
  }

  const todayInWeek = overview.today >= week.startDate && overview.today <= week.endDate;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <h4 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {t('roadmap.goals')}
          </h4>
          <ul className="space-y-1.5 text-sm">
            {week.goals.map((goal) => (
              <li key={goal} className="flex gap-2">
                <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                {goal}
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-2">
          <h4 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {t('roadmap.deliverable')}
          </h4>
          <p className="text-sm">{week.deliverable}</p>
          <p className="text-sm text-muted-foreground">{week.summary}</p>
        </div>
      </div>

      <div className="space-y-4">
        {detail.data.days.map((day) => (
          <section key={day.dayOffset} aria-label={format.date(day.date, { dateStyle: 'full' })} className="space-y-2">
            <h4 className="flex flex-wrap items-center gap-2 text-sm font-semibold">
              {t('common.day', { n: day.dayOffset + 1 })}
              <span className="font-normal text-muted-foreground">
                {format.date(day.date, { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
              {day.date === overview.today ? <Badge>{t('common.today')}</Badge> : null}
              {day.dayOffset >= 5 ? <Badge variant="secondary">{t('common.optional')}</Badge> : null}
            </h4>
            {day.tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('roadmap.emptyDay')}</p>
            ) : (
              <ul className="space-y-2">
                {day.tasks.map((task) => (
                  <PlanTaskRow
                    key={task.id}
                    task={task}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onMoveToday={onMoveToday}
                  />
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      <Button variant="outline" size="sm" onClick={() => onAdd(todayInWeek ? overview.today : week.startDate)}>
        <Plus aria-hidden="true" />
        {t('roadmap.addTask')}
      </Button>
    </div>
  );
}

function WeekCard({
  week,
  overview,
  open,
  onToggle,
  ...actions
}: {
  week: PlanWeekSummary;
  overview: PlanOverview;
  open: boolean;
  onToggle: () => void;
  onAdd: (defaultDate: string) => void;
  onEdit: (task: PlanTask) => void;
  onDelete: (task: PlanTask) => void;
  onMoveToday: (task: PlanTask) => void;
}) {
  const { t } = useTranslation();
  const format = useFormatters();
  const ref = useRef<HTMLLIElement>(null);
  const current = overview.currentWeek === week.weekNumber;
  const percent =
    week.totals.coreTasks > 0 ? (week.totals.coreCompleted / week.totals.coreTasks) * 100 : 0;

  return (
    <li
      ref={ref}
      id={`week-${week.weekNumber}`}
      className={cn(
        'scroll-mt-20 rounded-2xl border bg-card shadow-card',
        current && 'border-primary/40',
      )}
    >
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`week-panel-${week.weekNumber}`}
          onClick={onToggle}
          className="flex w-full items-center gap-3 rounded-2xl p-4 text-left outline-none transition-colors hover:bg-accent/30 focus-visible:ring-[3px] focus-visible:ring-ring/40 sm:p-5"
        >
          <span
            className={cn(
              'flex size-11 shrink-0 flex-col items-center justify-center rounded-xl text-xs leading-none',
              current ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
            )}
          >
            <span className="text-[0.625rem] uppercase">{t('roadmap.weekShort')}</span>
            <span className="text-base font-semibold">{week.weekNumber}</span>
          </span>
          <span className="min-w-0 flex-1 space-y-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{week.title}</span>
              {current ? <Badge>{t('roadmap.current')}</Badge> : null}
            </span>
            <span className="block text-xs text-muted-foreground">
              {week.phaseTitle} · {format.date(week.startDate, { day: 'numeric', month: 'short' })} –{' '}
              {format.date(week.endDate, { day: 'numeric', month: 'short' })}
            </span>
            <span className="flex items-center gap-3">
              <ProgressBar value={percent} label={week.title} className="h-1.5 max-w-48" />
              <span className="text-xs text-muted-foreground tabular-nums">
                {t('roadmap.coreProgress', {
                  done: week.totals.coreCompleted,
                  total: week.totals.coreTasks,
                })}
              </span>
            </span>
          </span>
          <ChevronDown
            aria-hidden="true"
            className={cn('size-5 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')}
          />
        </button>
      </h3>
      {open ? (
        <div id={`week-panel-${week.weekNumber}`} className="border-t p-4 sm:p-5">
          <WeekBody week={week} overview={overview} {...actions} />
        </div>
      ) : null}
    </li>
  );
}

function RoadmapContent({ overview }: { overview: PlanOverview }) {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const [initialWeek] = useState(() => {
    const requested = Number(params.get('week'));
    return Number.isInteger(requested) && requested >= 1 && requested <= ROADMAP_WEEK_COUNT
      ? requested
      : (overview.currentWeek ?? 1);
  });
  const [deepLinked] = useState(() => params.get('week') !== null);
  const [openWeek, setOpenWeek] = useState<number | null>(initialWeek);
  const [dialog, setDialog] = useState<{ task?: PlanTask; defaultDate?: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PlanTask | null>(null);
  const update = useUpdatePlanTask();
  const remove = useDeletePlanTask();

  useEffect(() => {
    if (deepLinked) document.getElementById(`week-${initialWeek}`)?.scrollIntoView({ block: 'start' });
  }, [deepLinked, initialWeek]);

  const select = (week: number) => {
    setOpenWeek(week);
    setParams({ week: String(week) }, { replace: true });
    window.setTimeout(() => document.getElementById(`week-${week}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 0);
  };

  const moveToToday = (task: PlanTask) => {
    const offset = diffDays(overview.today, overview.plan.startDate);
    if (offset < 0 || offset >= ROADMAP_WEEK_COUNT * 7) {
      toast.error(t('roadmap.dateOutside'));
      return;
    }
    update.mutate(
      { id: task.id, scheduledDate: overview.today },
      {
        onSuccess: () => toast.success(t('roadmap.taskSaved')),
        onError: () => toast.error(t('common.errorTitle')),
      },
    );
  };

  return (
    <>
      <PlanSummary overview={overview} />
      <PhaseStrip overview={overview} onOpenWeek={select} />
      <ol className="space-y-3">
        {overview.weeks.map((week) => (
          <WeekCard
            key={week.weekNumber}
            week={week}
            overview={overview}
            open={openWeek === week.weekNumber}
            onToggle={() => setOpenWeek(openWeek === week.weekNumber ? null : week.weekNumber)}
            onAdd={(defaultDate) => setDialog({ defaultDate })}
            onEdit={(task) => setDialog({ task })}
            onDelete={setDeleteTarget}
            onMoveToday={moveToToday}
          />
        ))}
      </ol>

      <TaskDialog
        open={dialog !== null}
        onOpenChange={(open) => !open && setDialog(null)}
        plan={overview.plan}
        task={dialog?.task}
        defaultDate={dialog?.defaultDate}
      />
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t('roadmap.deleteTask')}
        description={t('roadmap.deleteConfirm', { title: deleteTarget?.title ?? '' })}
        confirmLabel={t('common.delete')}
        pending={remove.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          remove.mutate(deleteTarget.id, {
            onSuccess: () => {
              toast.success(t('roadmap.taskDeleted'));
              setDeleteTarget(null);
            },
            onError: () => toast.error(t('common.errorTitle')),
          });
        }}
      />
    </>
  );
}

export function Component() {
  const { t } = useTranslation();
  const plan = usePlan();
  return (
    <PageContainer>
      <PageHeader title={t('roadmap.title')} description={t('roadmap.subtitle')} />
      <QueryBoundary
        query={plan}
        skeleton={
          <div className="space-y-4" aria-hidden="true">
            <Skeleton className="h-40" />
            <Skeleton className="h-36" />
            <Skeleton className="h-24" />
          </div>
        }
      >
        {(overview) =>
          overview.weeks.length === 0 ? (
            <EmptyState title={t('common.errorTitle')} />
          ) : (
            <RoadmapContent overview={overview} />
          )
        }
      </QueryBoundary>
    </PageContainer>
  );
}
