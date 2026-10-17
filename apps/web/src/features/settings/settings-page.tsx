import {
  LOCALES,
  TRACK_SLUGS,
  type Locale,
  type Preferences,
  type Theme,
  type TrackSlug,
} from '@dlos/shared';
import { Badge, Button, Input, Label, NativeSelect, Skeleton, Switch, cn, toast } from '@dlos/ui';
import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react';
import { useId, useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { PageContainer, PageHeader, QueryBoundary, SectionCard } from '../../components/page';
import {
  useHealth,
  usePlan,
  usePreferences,
  useResetPlan,
  useUpdatePlan,
  useUpdatePreferences,
} from '../../lib/queries';
import { useUiStore } from '../../stores/ui-store';
import { ConfirmDialog } from '../roadmap/task-dialogs';

function OptionCards<T extends string>({
  legend,
  name,
  value,
  options,
  onChange,
}: {
  legend: string;
  name: string;
  value: T;
  options: Array<{ value: T; label: string; icon?: LucideIcon; lang?: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="grid gap-2">
      <legend className="sr-only">{legend}</legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {options.map((option) => {
          const Icon = option.icon;
          return (
            <label key={option.value} className="relative cursor-pointer">
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange(option.value)}
                className="peer sr-only"
              />
              <span
                lang={option.lang}
                className={cn(
                  'flex items-center gap-2.5 rounded-xl border bg-card px-4 py-3 text-sm font-medium transition-colors hover:bg-accent/40',
                  'peer-checked:border-primary peer-checked:bg-accent peer-checked:text-accent-foreground peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/40',
                )}
              >
                {Icon ? <Icon aria-hidden="true" className="size-4" /> : null}
                {option.label}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function PreferencesForm({ preferences }: { preferences: Preferences }) {
  const { t } = useTranslation();
  const ids = useId();
  const update = useUpdatePreferences();
  const [name, setName] = useState(preferences.displayName);
  const [timezone, setTimezone] = useState(preferences.timezone);
  const [goals, setGoals] = useState<Record<TrackSlug, string>>(
    () =>
      Object.fromEntries(
        TRACK_SLUGS.map((slug) => [slug, String(preferences.dailyGoals[slug])]),
      ) as Record<TrackSlug, string>,
  );
  const [streakMin, setStreakMin] = useState(String(preferences.streakMinMinutes));
  const [error, setError] = useState<string | null>(null);

  const zones = useMemo(() => {
    const all = Intl.supportedValuesOf('timeZone');
    const set = new Set([...all, 'UTC', preferences.timezone]);
    return [...set].sort();
  }, [preferences.timezone]);

  const total = TRACK_SLUGS.reduce((sum, slug) => sum + (Number(goals[slug]) || 0), 0);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const parsedGoals = Object.fromEntries(TRACK_SLUGS.map((slug) => [slug, Number(goals[slug])]));
    const values = Object.values(parsedGoals);
    if (values.some((value) => !Number.isInteger(value) || value < 0 || value > 480)) {
      setError(t('settings.goals.invalid'));
      return;
    }
    const streakValue = Number(streakMin);
    if (!Number.isInteger(streakValue) || streakValue < 1 || streakValue > 240) {
      setError(t('settings.goals.invalid'));
      return;
    }
    if (name.trim().length === 0) {
      setError(t('settings.profile.nameRequired'));
      return;
    }
    setError(null);
    update.mutate(
      {
        displayName: name.trim(),
        timezone,
        dailyGoals: parsedGoals,
        streakMinMinutes: Number(streakMin),
      },
      {
        onSuccess: () => toast.success(t('settings.saved')),
        onError: (failure) => {
          setError(failure.message);
          toast.error(t('settings.saveFailed'));
        },
      },
    );
  };

  return (
    <form onSubmit={submit} className="grid gap-6" noValidate>
      <SectionCard title={t('settings.profile.title')}>
        <div className="grid max-w-md gap-1.5">
          <Label htmlFor={`${ids}-name`}>{t('settings.profile.name')}</Label>
          <Input id={`${ids}-name`} value={name} maxLength={60} onChange={(event) => setName(event.target.value)} />
        </div>
      </SectionCard>

      <SectionCard title={t('settings.goals.title')} description={t('settings.goals.description')}>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {TRACK_SLUGS.map((slug) => (
              <div key={slug} className="grid gap-1.5">
                <Label htmlFor={`${ids}-goal-${slug}`}>{t(`tracks.${slug}`)}</Label>
                <Input
                  id={`${ids}-goal-${slug}`}
                  inputMode="numeric"
                  value={goals[slug]}
                  onChange={(event) => setGoals((previous) => ({ ...previous, [slug]: event.target.value }))}
                />
              </div>
            ))}
          </div>
          <p className="text-sm font-medium tabular-nums">{t('settings.goals.total', { value: total })}</p>
          <div className="grid max-w-xs gap-1.5">
            <Label htmlFor={`${ids}-streak`}>{t('settings.goals.streak')}</Label>
            <Input
              id={`${ids}-streak`}
              inputMode="numeric"
              value={streakMin}
              onChange={(event) => setStreakMin(event.target.value)}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title={t('settings.timezone.title')} description={t('settings.timezone.description')}>
        <div className="grid max-w-md gap-1.5">
          <Label htmlFor={`${ids}-tz`} className="sr-only">
            {t('settings.timezone.title')}
          </Label>
          <NativeSelect id={`${ids}-tz`} value={timezone} onChange={(event) => setTimezone(event.target.value)}>
            {zones.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </NativeSelect>
        </div>
      </SectionCard>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div>
        <Button type="submit" disabled={update.isPending}>
          {update.isPending ? t('common.saving') : t('common.save')}
        </Button>
      </div>
    </form>
  );
}

function PlanSettings() {
  const { t } = useTranslation();
  const plan = usePlan();
  const update = useUpdatePlan();
  const reset = useResetPlan();
  const [start, setStart] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const current = plan.data?.plan.startDate ?? '';
  const value = start ?? current;

  return (
    <SectionCard title={t('settings.plan.title')} description={t('settings.plan.description')}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-2">
          <div className="grid gap-1.5">
            <Label htmlFor="settings-plan-start">{t('settings.plan.start')}</Label>
            <Input
              id="settings-plan-start"
              type="date"
              className="w-44"
              value={value}
              disabled={!plan.data}
              onChange={(event) => setStart(event.target.value)}
            />
          </div>
          <Button
            variant="outline"
            disabled={!plan.data || value === current || value === '' || update.isPending}
            onClick={() =>
              update.mutate(
                { startDate: value },
                {
                  onSuccess: () => {
                    setStart(null);
                    toast.success(t('settings.plan.moved'));
                  },
                  onError: () => toast.error(t('settings.saveFailed')),
                },
              )
            }
          >
            {t('settings.plan.saveStart')}
          </Button>
        </div>
        <Button variant="destructive" disabled={!plan.data} onClick={() => setConfirmOpen(true)}>
          {t('settings.plan.reset')}
        </Button>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t('settings.plan.resetTitle')}
        description={t('settings.plan.resetBody')}
        confirmLabel={t('settings.plan.resetConfirm')}
        pending={reset.isPending}
        onConfirm={() =>
          reset.mutate(undefined, {
            onSuccess: () => {
              setConfirmOpen(false);
              setStart(null);
              toast.success(t('settings.plan.resetDone'));
            },
            onError: () => toast.error(t('settings.saveFailed')),
          })
        }
      />
    </SectionCard>
  );
}

function AboutSections() {
  const { t } = useTranslation();
  const health = useHealth();
  return (
    <>
      <SectionCard title={t('settings.ai.title')} description={t('settings.ai.description')}>
        {health.data ? (
          <dl className="grid gap-3 text-sm sm:grid-cols-[10rem_1fr]">
            <dt className="text-muted-foreground">{t('settings.ai.provider')}</dt>
            <dd>{t('settings.ai.none')}</dd>
            <dt className="text-muted-foreground">{t('settings.ai.status')}</dt>
            <dd className="space-y-1">
              <Badge variant="secondary">{health.data.ai.status}</Badge>
              <p className="text-muted-foreground">{health.data.ai.message}</p>
            </dd>
          </dl>
        ) : (
          <Skeleton className="h-16 w-full" />
        )}
      </SectionCard>

      <SectionCard title={t('settings.data.title')}>
        <p className="text-sm text-muted-foreground">{t('settings.data.description')}</p>
      </SectionCard>

      <SectionCard title={t('settings.about.title')}>
        <dl className="grid gap-3 text-sm sm:grid-cols-[10rem_1fr]">
          <dt className="text-muted-foreground">{t('settings.about.version')}</dt>
          <dd>{health.data?.version ?? '…'}</dd>
          <dt className="text-muted-foreground">{t('settings.about.phase')}</dt>
          <dd>{t('settings.about.phaseValue')}</dd>
        </dl>
      </SectionCard>
    </>
  );
}

export function Component() {
  const { t } = useTranslation();
  const preferences = usePreferences();
  const locale = useUiStore((state) => state.locale);
  const theme = useUiStore((state) => state.theme);
  const setLocale = useUiStore((state) => state.setLocale);
  const setTheme = useUiStore((state) => state.setTheme);
  const autoTrackStudy = useUiStore((state) => state.autoTrackStudy);
  const setAutoTrackStudy = useUiStore((state) => state.setAutoTrackStudy);
  const autoTrackId = useId();
  const update = useUpdatePreferences();

  const themeOptions: Array<{ value: Theme; label: string; icon: LucideIcon }> = [
    { value: 'light', label: t('header.themeLight'), icon: Sun },
    { value: 'dark', label: t('header.themeDark'), icon: Moon },
    { value: 'system', label: t('header.themeSystem'), icon: Monitor },
  ];
  const localeNames: Record<Locale, string> = {
    'hi-Latn': t('settings.language.hinglish'),
    en: t('settings.language.english'),
    hi: t('settings.language.hindi'),
  };

  return (
    <PageContainer>
      <PageHeader title={t('settings.title')} description={t('settings.subtitle')} />

      <div className="grid gap-6">
        <SectionCard title={t('settings.language.title')} description={t('settings.language.description')}>
          <div className="space-y-3">
            <OptionCards<Locale>
              legend={t('settings.language.title')}
              name="locale"
              value={locale}
              options={LOCALES.map((code) => ({
                value: code,
                label: localeNames[code],
                lang: code,
              }))}
              onChange={(next) => {
                setLocale(next);
                update.mutate({ locale: next });
              }}
            />
            <p className="text-sm text-muted-foreground">{t('settings.language.note')}</p>
          </div>
        </SectionCard>

        <SectionCard title={t('settings.appearance.title')} description={t('settings.appearance.description')}>
          <OptionCards<Theme>
            legend={t('settings.appearance.title')}
            name="theme"
            value={theme}
            options={themeOptions}
            onChange={(next) => {
              setTheme(next);
              update.mutate({ theme: next });
            }}
          />
        </SectionCard>

        <SectionCard title={t('settings.study.title')}>
          <div className="flex items-start gap-3">
            <Switch id={autoTrackId} checked={autoTrackStudy} onCheckedChange={setAutoTrackStudy} />
            <div className="space-y-1">
              <Label htmlFor={autoTrackId}>{t('settings.study.autoTrack')}</Label>
              <p className="text-sm text-muted-foreground">{t('settings.study.autoTrackHint')}</p>
            </div>
          </div>
        </SectionCard>

        <QueryBoundary query={preferences} skeleton={<Skeleton className="h-96 w-full" />}>
          {(data) => <PreferencesForm key={JSON.stringify(data)} preferences={data} />}
        </QueryBoundary>

        <PlanSettings />
        <AboutSections />
      </div>
    </PageContainer>
  );
}
