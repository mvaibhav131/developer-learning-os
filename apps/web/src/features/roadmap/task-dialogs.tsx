import {
  PLAN_TASK_KINDS,
  ROADMAP_WEEK_COUNT,
  TRACK_SLUGS,
  addDays,
  diffDays,
  type PlanOverview,
  type PlanTask,
  type PlanTaskKind,
  type TrackSlug,
} from '@dlos/shared';
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FieldError,
  Input,
  Label,
  NativeSelect,
  toast,
} from '@dlos/ui';
import { useId, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useCreatePlanTask, useUpdatePlanTask } from '../../lib/queries';

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  destructive = true,
  pending = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  pending?: boolean;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t('common.close')}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button variant={destructive ? 'destructive' : 'default'} disabled={pending} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface TaskFormProps {
  plan: PlanOverview['plan'];
  task?: PlanTask;
  /** Date preselected when adding a task. */
  defaultDate?: string;
  onDone: () => void;
}

function TaskForm({ plan, task, defaultDate, onDone }: TaskFormProps) {
  const { t } = useTranslation();
  const ids = useId();
  const create = useCreatePlanTask();
  const update = useUpdatePlanTask();
  const pending = create.isPending || update.isPending;

  const [title, setTitle] = useState(task?.title ?? '');
  const [trackSlug, setTrackSlug] = useState<TrackSlug>(task?.trackSlug ?? 'ai');
  const [kind, setKind] = useState<PlanTaskKind>(task?.kind ?? 'practice');
  const [minutes, setMinutes] = useState(String(task?.plannedMinutes ?? 30));
  const [date, setDate] = useState(task?.scheduledDate ?? defaultDate ?? plan.startDate);
  const [optional, setOptional] = useState(task?.isOptional ?? false);
  const [error, setError] = useState<string | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const plannedMinutes = Number(minutes);
    const offset = diffDays(date, plan.startDate);
    if (title.trim().length === 0 || title.trim().length > 160) {
      setError(t('roadmap.fields.title'));
      return;
    }
    if (!Number.isInteger(plannedMinutes) || plannedMinutes < 5 || plannedMinutes > 480) {
      setError(t('roadmap.fields.minutes'));
      return;
    }
    if (Number.isNaN(offset) || offset < 0 || offset >= ROADMAP_WEEK_COUNT * 7) {
      setError(t('roadmap.dateOutside'));
      return;
    }
    setError(null);

    const onError = (failure: Error) => setError(failure.message);
    if (task) {
      update.mutate(
        {
          id: task.id,
          title: title.trim(),
          trackSlug,
          kind,
          plannedMinutes,
          isOptional: optional,
          ...(date !== task.scheduledDate ? { scheduledDate: date } : {}),
        },
        {
          onSuccess: () => {
            toast.success(t('roadmap.taskSaved'));
            onDone();
          },
          onError,
        },
      );
      return;
    }
    create.mutate(
      {
        weekNumber: Math.floor(offset / 7) + 1,
        dayOffset: offset % 7,
        trackSlug,
        kind,
        title: title.trim(),
        plannedMinutes,
        isOptional: optional,
      },
      {
        onSuccess: () => {
          toast.success(t('roadmap.taskAdded'));
          onDone();
        },
        onError,
      },
    );
  };

  return (
    <form onSubmit={submit} className="grid gap-4" noValidate>
      <div className="grid gap-1.5">
        <Label htmlFor={`${ids}-title`}>{t('roadmap.fields.title')}</Label>
        <Input
          id={`${ids}-title`}
          value={title}
          maxLength={160}
          onChange={(event) => setTitle(event.target.value)}
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor={`${ids}-track`}>{t('roadmap.fields.track')}</Label>
          <NativeSelect
            id={`${ids}-track`}
            value={trackSlug}
            onChange={(event) => setTrackSlug(event.target.value as TrackSlug)}
          >
            {TRACK_SLUGS.map((slug) => (
              <option key={slug} value={slug}>
                {t(`tracks.${slug}`)}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`${ids}-kind`}>{t('roadmap.fields.kind')}</Label>
          <NativeSelect
            id={`${ids}-kind`}
            value={kind}
            onChange={(event) => setKind(event.target.value as PlanTaskKind)}
          >
            {PLAN_TASK_KINDS.map((value) => (
              <option key={value} value={value}>
                {t(`taskKind.${value}`)}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`${ids}-minutes`}>{t('roadmap.fields.minutes')}</Label>
          <Input
            id={`${ids}-minutes`}
            inputMode="numeric"
            value={minutes}
            onChange={(event) => setMinutes(event.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`${ids}-date`}>{t('roadmap.fields.date')}</Label>
          <Input
            id={`${ids}-date`}
            type="date"
            value={date}
            min={plan.startDate}
            max={addDays(plan.startDate, ROADMAP_WEEK_COUNT * 7 - 1)}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id={`${ids}-optional`}
          checked={optional}
          onCheckedChange={(checked) => setOptional(checked === true)}
        />
        <Label htmlFor={`${ids}-optional`} className="font-normal">
          {t('roadmap.fields.optional')}
        </Label>
      </div>
      {error ? <FieldError>{error}</FieldError> : null}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? t('common.saving') : t('common.save')}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function TaskDialog({
  open,
  onOpenChange,
  plan,
  task,
  defaultDate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: PlanOverview['plan'];
  task?: PlanTask | undefined;
  defaultDate?: string | undefined;
}) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t('common.close')}>
        <DialogHeader>
          <DialogTitle>{task ? t('roadmap.editTaskTitle') : t('roadmap.addTaskTitle')}</DialogTitle>
          <DialogDescription>{t('roadmap.subtitle')}</DialogDescription>
        </DialogHeader>
        {open ? (
          <TaskForm
            key={task?.id ?? 'new'}
            plan={plan}
            {...(task ? { task } : {})}
            {...(defaultDate ? { defaultDate } : {})}
            onDone={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
