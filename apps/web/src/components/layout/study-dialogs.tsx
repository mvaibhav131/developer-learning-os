import { TRACK_SLUGS, type PlanTask, type TrackSlug } from '@dlos/shared';
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
  Textarea,
  toast,
} from '@dlos/ui';
import { Play, Square, Timer } from 'lucide-react';
import { useId, useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { clockText, useFormatters } from '../../lib/format';
import { useNow } from '../../lib/hooks';
import { useCreateStudySession, useDashboard } from '../../lib/queries';
import { useOverlayStore, type LogSessionPrefill } from '../../stores/overlay-store';
import { elapsedMinutes, useTimerStore } from '../../stores/timer-store';

function useSelectableTasks(): PlanTask[] {
  const dashboard = useDashboard();
  return useMemo(() => {
    const data = dashboard.data;
    if (!data) return [];
    const open = data.todayTasks.filter((task) => !task.completedAt);
    if (data.nextUp && !open.some((task) => task.id === data.nextUp?.id)) open.push(data.nextUp);
    return open;
  }, [dashboard.data]);
}

function TrackSelect({
  id,
  value,
  onChange,
}: {
  id: string;
  value: TrackSlug;
  onChange: (value: TrackSlug) => void;
}) {
  const { t } = useTranslation();
  return (
    <NativeSelect id={id} value={value} onChange={(event) => onChange(event.target.value as TrackSlug)}>
      {TRACK_SLUGS.map((slug) => (
        <option key={slug} value={slug}>
          {t(`tracks.${slug}`)}
        </option>
      ))}
    </NativeSelect>
  );
}

function TaskSelect({
  id,
  tasks,
  value,
  onChange,
}: {
  id: string;
  tasks: PlanTask[];
  value: number | '';
  onChange: (task: PlanTask | undefined) => void;
}) {
  const { t } = useTranslation();
  return (
    <NativeSelect
      id={id}
      value={value}
      onChange={(event) =>
        onChange(tasks.find((task) => String(task.id) === event.target.value))
      }
    >
      <option value="">{t('study.noTask')}</option>
      {tasks.map((task) => (
        <option key={task.id} value={task.id}>
          {task.title}
        </option>
      ))}
    </NativeSelect>
  );
}

function LogStudyForm({ prefill, onDone }: { prefill: LogSessionPrefill; onDone: () => void }) {
  const { t } = useTranslation();
  const format = useFormatters();
  const ids = useId();
  const tasks = useSelectableTasks();
  const dashboard = useDashboard();
  const create = useCreateStudySession();

  const [trackSlug, setTrackSlug] = useState<TrackSlug>(prefill.trackSlug ?? 'ai');
  const [minutes, setMinutes] = useState('30');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [taskId, setTaskId] = useState<number | ''>(prefill.planTaskId ?? '');
  const [completeTask, setCompleteTask] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = dashboard.data?.today;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const value = Number(minutes);
    if (!Number.isInteger(value) || value < 1 || value > 600) {
      setError(t('study.invalidMinutes'));
      return;
    }
    setError(null);
    create.mutate(
      {
        trackSlug,
        durationMinutes: value,
        ...(date ? { studiedOn: date } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
        ...(taskId !== '' ? { planTaskId: taskId, completePlanTask: completeTask } : {}),
        ...(prefill.lessonSlug ? { lessonSlug: prefill.lessonSlug } : {}),
        source: 'manual',
      },
      {
        onSuccess: () => {
          toast.success(t('study.logged'), {
            description: t('study.loggedBody', {
              minutes: format.number(value),
              track: t(`tracks.${trackSlug}`),
            }),
          });
          onDone();
        },
        onError: (failure) => setError(failure.message),
      },
    );
  };

  return (
    <form onSubmit={submit} className="grid gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor={`${ids}-track`}>{t('study.track')}</Label>
          <TrackSelect id={`${ids}-track`} value={trackSlug} onChange={setTrackSlug} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`${ids}-minutes`}>{t('study.minutes')}</Label>
          <Input
            id={`${ids}-minutes`}
            inputMode="numeric"
            value={minutes}
            onChange={(event) => setMinutes(event.target.value)}
            aria-invalid={error !== null}
            aria-describedby={error ? `${ids}-error` : undefined}
          />
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={`${ids}-date`}>{t('study.date')}</Label>
        <Input
          id={`${ids}-date`}
          type="date"
          value={date || (today ?? '')}
          max={today}
          onChange={(event) => setDate(event.target.value)}
        />
      </div>
      {tasks.length > 0 || taskId !== '' ? (
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor={`${ids}-task`}>{t('study.linkTask')}</Label>
            <TaskSelect
              id={`${ids}-task`}
              tasks={tasks}
              value={taskId}
              onChange={(task) => {
                setTaskId(task?.id ?? '');
                if (task) setTrackSlug(task.trackSlug);
              }}
            />
          </div>
          {taskId !== '' ? (
            <div className="flex items-center gap-2">
              <Checkbox
                id={`${ids}-complete`}
                checked={completeTask}
                onCheckedChange={(checked) => setCompleteTask(checked === true)}
              />
              <Label htmlFor={`${ids}-complete`} className="font-normal">
                {t('study.completeTask')}
              </Label>
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="grid gap-1.5">
        <Label htmlFor={`${ids}-note`}>{t('study.note')}</Label>
        <Textarea
          id={`${ids}-note`}
          value={note}
          maxLength={500}
          placeholder={t('study.notePlaceholder')}
          onChange={(event) => setNote(event.target.value)}
        />
      </div>
      {error ? <FieldError id={`${ids}-error`}>{error}</FieldError> : null}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? t('common.saving') : t('study.submit')}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function LogStudyDialog() {
  const { t } = useTranslation();
  const { open, prefill } = useOverlayStore((state) => state.logSession);
  const close = useOverlayStore((state) => state.closeLogSession);
  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent closeLabel={t('common.close')}>
        <DialogHeader>
          <DialogTitle>{t('study.logTitle')}</DialogTitle>
          <DialogDescription>{t('study.logDescription')}</DialogDescription>
        </DialogHeader>
        <LogStudyForm prefill={prefill} onDone={close} />
      </DialogContent>
    </Dialog>
  );
}

function StartTimerForm({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation();
  const ids = useId();
  const tasks = useSelectableTasks();
  const start = useTimerStore((state) => state.start);
  const active = useTimerStore((state) => state.active);
  const [trackSlug, setTrackSlug] = useState<TrackSlug>('ai');
  const [taskId, setTaskId] = useState<number | ''>('');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    start({ trackSlug, ...(taskId !== '' ? { planTaskId: taskId } : {}) });
    onDone();
  };

  return (
    <form onSubmit={submit} className="grid gap-4">
      {active ? <p className="text-sm text-warning">{t('study.timerActive')}</p> : null}
      <div className="grid gap-1.5">
        <Label htmlFor={`${ids}-track`}>{t('study.track')}</Label>
        <TrackSelect id={`${ids}-track`} value={trackSlug} onChange={setTrackSlug} />
      </div>
      {tasks.length > 0 ? (
        <div className="grid gap-1.5">
          <Label htmlFor={`${ids}-task`}>{t('study.linkTask')}</Label>
          <TaskSelect
            id={`${ids}-task`}
            tasks={tasks}
            value={taskId}
            onChange={(task) => {
              setTaskId(task?.id ?? '');
              if (task) setTrackSlug(task.trackSlug);
            }}
          />
        </div>
      ) : null}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={active !== null}>
          <Play aria-hidden="true" />
          {t('study.start')}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function StartTimerDialog() {
  const { t } = useTranslation();
  const open = useOverlayStore((state) => state.timerDialogOpen);
  const setOpen = useOverlayStore((state) => state.setTimerDialogOpen);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent closeLabel={t('common.close')}>
        <DialogHeader>
          <DialogTitle>{t('study.timerTitle')}</DialogTitle>
          <DialogDescription>{t('study.timerDescription')}</DialogDescription>
        </DialogHeader>
        <StartTimerForm onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function StopTimerForm({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation();
  const format = useFormatters();
  const ids = useId();
  const timer = useTimerStore((state) => state.active);
  const clear = useTimerStore((state) => state.clear);
  const create = useCreateStudySession();
  const [now] = useState(() => Date.now());
  const [minutes, setMinutes] = useState(() => String(timer ? elapsedMinutes(timer, now) : 0));
  const [completeTask, setCompleteTask] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!timer) return null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const value = Number(minutes);
    if (!Number.isInteger(value) || value < 0 || value > 600) {
      setError(t('study.invalidMinutes'));
      return;
    }
    if (value < 1) {
      toast.info(t('study.tooShort'));
      clear();
      onDone();
      return;
    }
    create.mutate(
      {
        trackSlug: timer.trackSlug,
        durationMinutes: value,
        source: 'timer',
        ...(timer.planTaskId ? { planTaskId: timer.planTaskId, completePlanTask: completeTask } : {}),
        ...(timer.lessonSlug ? { lessonSlug: timer.lessonSlug } : {}),
      },
      {
        onSuccess: () => {
          clear();
          toast.success(t('study.logged'), {
            description: t('study.loggedBody', {
              minutes: format.number(value),
              track: t(`tracks.${timer.trackSlug}`),
            }),
          });
          onDone();
        },
        onError: (failure) => setError(failure.message),
      },
    );
  };

  return (
    <form onSubmit={submit} className="grid gap-4" noValidate>
      <div className="grid gap-1.5">
        <Label htmlFor={`${ids}-minutes`}>{t('study.minutes')}</Label>
        <Input
          id={`${ids}-minutes`}
          inputMode="numeric"
          value={minutes}
          onChange={(event) => setMinutes(event.target.value)}
          aria-invalid={error !== null}
        />
      </div>
      {timer.planTaskId ? (
        <div className="flex items-center gap-2">
          <Checkbox
            id={`${ids}-complete`}
            checked={completeTask}
            onCheckedChange={(checked) => setCompleteTask(checked === true)}
          />
          <Label htmlFor={`${ids}-complete`} className="font-normal">
            {t('study.completeTask')}
          </Label>
        </div>
      ) : null}
      {error ? <FieldError>{error}</FieldError> : null}
      <DialogFooter>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            clear();
            onDone();
          }}
        >
          {t('study.discard')}
        </Button>
        <Button type="button" variant="outline" onClick={onDone}>
          {t('study.keepRunning')}
        </Button>
        <Button type="submit" disabled={create.isPending}>
          {t('study.stopAndLog')}
        </Button>
      </DialogFooter>
    </form>
  );
}

/** Header control: starts the timer when idle, shows elapsed time and stops it when running. */
export function TimerChip() {
  const { t } = useTranslation();
  const timer = useTimerStore((state) => state.active);
  const setTimerDialogOpen = useOverlayStore((state) => state.setTimerDialogOpen);
  const [stopOpen, setStopOpen] = useState(false);
  const now = useNow(1000);

  if (!timer) {
    return (
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={t('study.timerTitle')}
        onClick={() => setTimerDialogOpen(true)}
      >
        <Timer aria-hidden="true" />
      </Button>
    );
  }

  const seconds = Math.max(0, Math.floor((now - timer.startedAt) / 1000));
  return (
    <>
      <Button
        variant="soft"
        size="sm"
        onClick={() => setStopOpen(true)}
        aria-label={`${t('header.timerRunning')}: ${clockText(seconds)}. ${t('study.stopTitle')}`}
      >
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-70" />
          <span className="relative inline-flex size-2 rounded-full bg-success" />
        </span>
        <span className="tabular-nums">{clockText(seconds)}</span>
        <Square aria-hidden="true" className="size-3 fill-current" />
      </Button>
      <Dialog open={stopOpen} onOpenChange={setStopOpen}>
        <DialogContent closeLabel={t('common.close')}>
          <DialogHeader>
            <DialogTitle>{t('study.stopTitle')}</DialogTitle>
            <DialogDescription>
              {t('study.elapsed')}: {clockText(seconds)}
            </DialogDescription>
          </DialogHeader>
          <StopTimerForm onDone={() => setStopOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
