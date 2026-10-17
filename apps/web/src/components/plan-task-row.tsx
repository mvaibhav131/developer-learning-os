import type { PlanTask } from '@dlos/shared';
import {
  Badge,
  Button,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  cn,
  toast,
} from '@dlos/ui';
import { CalendarCheck, Clock, Ellipsis, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { useFormatters } from '../lib/format';
import { useUpdatePlanTask } from '../lib/queries';
import { TaskKindBadge, TrackBadge } from './badges';

export function PlanTaskRow({
  task,
  showDate = false,
  onEdit,
  onMoveToday,
  onDelete,
}: {
  task: PlanTask;
  showDate?: boolean;
  onEdit?: (task: PlanTask) => void;
  onMoveToday?: (task: PlanTask) => void;
  onDelete?: (task: PlanTask) => void;
}) {
  const { t } = useTranslation();
  const format = useFormatters();
  const update = useUpdatePlanTask();
  const done = task.completedAt !== null;
  const hasMenu = Boolean(onEdit ?? onMoveToday ?? onDelete);

  const toggle = (checked: boolean | 'indeterminate') => {
    update.mutate(
      { id: task.id, completed: checked === true },
      { onError: () => toast.error(t('common.errorTitle')) },
    );
  };

  const titleClass = cn('font-medium leading-snug', done && 'text-muted-foreground line-through');
  const title = task.lesson ? (
    <Link to={`/lessons/${task.lesson.slug}`} className={cn(titleClass, 'hover:underline')}>
      {task.title}
    </Link>
  ) : task.projectSlug ? (
    <Link to={`/projects/${task.projectSlug}`} className={cn(titleClass, 'hover:underline')}>
      {task.title}
    </Link>
  ) : (
    <span className={titleClass}>{task.title}</span>
  );

  return (
    <li className="flex items-start gap-3 rounded-xl border bg-card/60 p-3 transition-colors hover:bg-accent/30">
      <span className="-m-1.5 p-1.5">
        <Checkbox
          checked={done}
          disabled={update.isPending}
          onCheckedChange={toggle}
          aria-label={t('dashboard.today.markDone', { title: task.title })}
        />
      </span>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="text-sm">{title}</div>
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <TrackBadge track={task.trackSlug} />
          <TaskKindBadge kind={task.kind} />
          {task.isOptional ? <Badge variant="secondary">{t('common.optional')}</Badge> : null}
          {task.isCustom ? <Badge variant="secondary">{t('roadmap.custom')}</Badge> : null}
          <span className="inline-flex items-center gap-1">
            <Clock aria-hidden="true" className="size-3" />
            {t('common.minutes', { value: format.number(task.plannedMinutes) })}
          </span>
          {showDate ? (
            <span>
              {format.date(task.scheduledDate, { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
          ) : null}
        </div>
      </div>
      {hasMenu ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={t('common.more')}>
              <Ellipsis aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEdit ? (
              <DropdownMenuItem onSelect={() => onEdit(task)}>
                <Pencil aria-hidden="true" />
                {t('common.edit')}
              </DropdownMenuItem>
            ) : null}
            {onMoveToday ? (
              <DropdownMenuItem onSelect={() => onMoveToday(task)}>
                <CalendarCheck aria-hidden="true" />
                {t('roadmap.moveToToday')}
              </DropdownMenuItem>
            ) : null}
            {onDelete ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => onDelete(task)}
                  className="text-destructive data-[highlighted]:text-destructive"
                >
                  <Trash2 aria-hidden="true" />
                  {t('roadmap.deleteTask')}
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </li>
  );
}
