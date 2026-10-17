import {
  DEFAULT_DAILY_GOALS,
  ROADMAP_WEEK_COUNT,
  TRACK_SLUGS,
  type TrackSlug,
} from '@dlos/shared';
import { Badge, Button, Card, CardContent, Skeleton, cn } from '@dlos/ui';
import {
  ArrowRight,
  BookOpenCheck,
  CircleCheck,
  CircleDashed,
  Hammer,
  MessagesSquare,
  Repeat,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { LogoMark } from '../../components/layout/logo';
import { LanguageSwitcher, ThemeToggle } from '../../components/layout/preferences-menus';
import { useFormatters } from '../../lib/format';
import { usePageTitle } from '../../lib/hooks';
import { usePlan, useProjects, useTracks } from '../../lib/queries';
import { TRACK_STYLE } from '../../lib/tracks';

const SECTION = 'mx-auto w-full max-w-6xl px-4 sm:px-6';

function SectionHeading({ id, title, subtitle }: { id?: string; title: string; subtitle?: string }) {
  return (
    <div className="mx-auto max-w-2xl space-y-3 text-center">
      <h2 id={id} className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
        {title}
      </h2>
      {subtitle ? <p className="text-pretty text-muted-foreground">{subtitle}</p> : null}
    </div>
  );
}

function LandingHeader() {
  const { t } = useTranslation();
  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className={cn(SECTION, 'flex h-16 items-center justify-between gap-3')}>
        <Link
          to="/"
          aria-label={t('common.appName')}
          className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
        >
          <LogoMark />
          <span className="hidden text-[0.95rem] font-semibold tracking-tight sm:inline">
            {t('common.appName')}
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
          <Button asChild size="sm" className="ml-1">
            <Link to="/dashboard">{t('landing.signIn')}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

/**
 * Decorative illustration of the default study routine. The minutes come from the real default
 * goals, and no learner progress is shown, so nothing in it can be mistaken for fake data.
 */
function RoutinePreview() {
  const { t } = useTranslation();
  const tracks = TRACK_SLUGS.filter((slug) => DEFAULT_DAILY_GOALS[slug] > 0);
  const total = tracks.reduce((sum, slug) => sum + DEFAULT_DAILY_GOALS[slug], 0);

  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-md">
      <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-primary/20 via-track-ai/10 to-track-system-design/20 blur-2xl" />
      <div className="space-y-4 rounded-2xl border bg-card p-5 shadow-pop">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{t('roadmap.title')}</p>
          <span className="text-xs text-muted-foreground tabular-nums">
            {t('common.core')} · {t('common.minutes', { value: total })}
          </span>
        </div>
        <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
          {tracks.map((slug) => (
            <div
              key={slug}
              className={TRACK_STYLE[slug].bar}
              style={{ width: `${(DEFAULT_DAILY_GOALS[slug] / total) * 100}%` }}
            />
          ))}
        </div>
        <ul className="space-y-2.5">
          {tracks.map((slug) => {
            const style = TRACK_STYLE[slug];
            const Icon = style.icon;
            return (
              <li key={slug} className="flex items-center gap-3 rounded-xl border bg-background/60 p-3">
                <span
                  className="grid size-9 shrink-0 place-items-center rounded-lg text-white"
                  style={{ background: style.gradient }}
                >
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{t(`tracks.${slug}`)}</span>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {t('common.minutes', { value: DEFAULT_DAILY_GOALS[slug] })}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function Hero() {
  const { t } = useTranslation();
  return (
    <section className="relative isolate overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(60rem_26rem_at_50%_-8rem,color-mix(in_oklch,var(--primary)_22%,transparent),transparent)]"
      />
      <div className={cn(SECTION, 'grid gap-12 py-14 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-28')}>
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="space-y-6"
        >
          <Badge variant="secondary" className="gap-1.5 py-1">
            <Sparkles aria-hidden="true" className="size-3.5" />
            {t('landing.eyebrow')}
          </Badge>
          <h1 className="text-4xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            {t('landing.title')}
          </h1>
          <p className="max-w-xl text-lg text-pretty text-muted-foreground">{t('landing.subtitle')}</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/dashboard">
                {t('landing.ctaPrimary')}
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#tracks">{t('landing.ctaSecondary')}</a>
            </Button>
          </div>
          <p className="max-w-xl text-sm text-muted-foreground">{t('landing.note')}</p>
        </motion.div>
        <RoutinePreview />
      </div>
    </section>
  );
}

function StatsStrip() {
  const { t } = useTranslation();
  const format = useFormatters();
  const tracks = useTracks();
  const projects = useProjects();

  const readyLessons = tracks.data?.tracks.reduce((sum, track) => sum + track.stats.completeLessonCount, 0);
  const items: Array<{ key: string; value: number | undefined; label: string }> = [
    { key: 'tracks', value: tracks.data?.tracks.length, label: t('landing.stats.tracks') },
    { key: 'lessons', value: readyLessons, label: t('landing.stats.lessons') },
    { key: 'weeks', value: ROADMAP_WEEK_COUNT, label: t('landing.stats.weeks') },
    { key: 'labs', value: projects.data?.projects.length, label: t('landing.stats.labs') },
  ];

  return (
    <section className={cn(SECTION, 'pb-4')}>
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border shadow-card lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.key} className="flex flex-col gap-1 bg-card px-5 py-5">
            <dt className="order-2 text-sm text-muted-foreground">{item.label}</dt>
            <dd className="order-1 text-3xl font-semibold tracking-tight tabular-nums">
              {item.value === undefined ? (
                tracks.isError || projects.isError ? (
                  <span aria-hidden="true">–</span>
                ) : (
                  <Skeleton className="h-9 w-16" />
                )
              ) : (
                format.number(item.value)
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function TracksSection() {
  const { t } = useTranslation();
  const format = useFormatters();
  const tracks = useTracks();
  const bySlug = new Map(tracks.data?.tracks.map((track) => [track.slug, track]));

  return (
    <section id="tracks" aria-labelledby="landing-tracks" className={cn(SECTION, 'scroll-mt-24 space-y-10 py-16')}>
      <SectionHeading id="landing-tracks" title={t('landing.tracksTitle')} subtitle={t('landing.tracksSubtitle')} />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TRACK_SLUGS.map((slug: TrackSlug) => {
          const style = TRACK_STYLE[slug];
          const Icon = style.icon;
          const track = bySlug.get(slug);
          return (
            <li key={slug}>
              <Link
                to={`/learn/${slug}`}
                className="group flex h-full flex-col gap-4 rounded-2xl border bg-card p-5 shadow-card outline-none transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-pop focus-visible:ring-[3px] focus-visible:ring-ring/40"
              >
                <span
                  className="grid size-11 place-items-center rounded-xl text-white"
                  style={{ background: style.gradient }}
                >
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <div className="space-y-1.5">
                  <h3 className="font-semibold tracking-tight group-hover:text-brand">{t(`tracks.${slug}`)}</h3>
                  {track ? (
                    <p className="text-sm text-pretty text-muted-foreground">{track.description}</p>
                  ) : tracks.isError ? null : (
                    <Skeleton className="h-10 w-full" />
                  )}
                </div>
                {track ? (
                  <p className="mt-auto text-xs text-muted-foreground tabular-nums">
                    {t('learn.courses', { value: format.number(track.courseCount) })}
                    {' · '}
                    {t('learn.lessons', { value: format.number(track.stats.lessonCount) })}
                  </p>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="text-center text-sm text-muted-foreground">{t('common.contentEnglishNote')}</p>
    </section>
  );
}

const STEPS: Array<{ key: 'learn' | 'practice' | 'revise' | 'build' | 'interview'; icon: LucideIcon }> = [
  { key: 'learn', icon: BookOpenCheck },
  { key: 'practice', icon: Hammer },
  { key: 'revise', icon: Repeat },
  { key: 'build', icon: Sparkles },
  { key: 'interview', icon: MessagesSquare },
];

function HowSection() {
  const { t } = useTranslation();
  return (
    <section aria-labelledby="landing-how" className="border-y bg-muted/40 py-16">
      <div className={cn(SECTION, 'space-y-10')}>
        <SectionHeading id="landing-how" title={t('landing.howTitle')} />
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <li key={step.key} className="space-y-3 rounded-2xl border bg-card p-5 shadow-card">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-lg bg-accent text-accent-foreground">
                    <Icon aria-hidden="true" className="size-4" />
                  </span>
                  <span className="text-sm font-medium text-muted-foreground tabular-nums">{index + 1}</span>
                </div>
                <h3 className="font-semibold">{t(`landing.steps.${step.key}.title`)}</h3>
                <p className="text-sm text-pretty text-muted-foreground">{t(`landing.steps.${step.key}.body`)}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

const PRINCIPLES = ['real', 'optionalAi', 'status', 'local'] as const;

function PrinciplesSection() {
  const { t } = useTranslation();
  return (
    <section aria-labelledby="landing-principles" className={cn(SECTION, 'space-y-10 py-16')}>
      <SectionHeading id="landing-principles" title={t('landing.principlesTitle')} />
      <ul className="grid gap-4 md:grid-cols-2">
        {PRINCIPLES.map((key) => (
          <li key={key}>
            <Card className="h-full">
              <CardContent className="flex gap-4">
                <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand" />
                <div className="space-y-1.5">
                  <h3 className="font-semibold">{t(`landing.principles.${key}.title`)}</h3>
                  <p className="text-sm text-pretty text-muted-foreground">
                    {t(`landing.principles.${key}.body`)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PlanSection() {
  const { t } = useTranslation();
  const plan = usePlan();
  const phases = plan.data?.phases;
  return (
    <section aria-labelledby="landing-plan" className="border-y bg-muted/40 py-16">
      <div className={cn(SECTION, 'space-y-10')}>
        <SectionHeading id="landing-plan" title={t('landing.planTitle')} subtitle={t('landing.planBody')} />
        {phases ? (
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {phases.map((phase, index) => (
              <li key={phase.key} className="flex items-start gap-3 rounded-2xl border bg-card p-4 shadow-card">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground tabular-nums">
                  {index + 1}
                </span>
                <div className="min-w-0 space-y-0.5">
                  <h3 className="leading-snug font-medium">{phase.title}</h3>
                  <p className="text-sm text-muted-foreground tabular-nums">
                    {phase.weekStart === phase.weekEnd
                      ? t('common.week', { n: phase.weekStart })
                      : t('common.week', { n: `${phase.weekStart}–${phase.weekEnd}` })}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        ) : plan.isError ? null : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-20" />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

const READY = ['lessons', 'practice', 'english', 'dashboard', 'roadmap', 'labs', 'languages'] as const;
const NEXT = ['content', 'design', 'rag', 'tutor'] as const;

function StatusList({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-4 rounded-2xl border bg-card p-6 shadow-card">
      <h3 className="font-semibold">{title}</h3>
      <ul className="space-y-3 text-sm">{children}</ul>
    </div>
  );
}

function StatusSection() {
  const { t } = useTranslation();
  return (
    <section aria-labelledby="landing-status" className={cn(SECTION, 'space-y-10 py-16')}>
      <SectionHeading id="landing-status" title={t('landing.statusTitle')} />
      <div className="grid gap-4 lg:grid-cols-2">
        <StatusList title={t('landing.statusReady')}>
          {READY.map((key) => (
            <li key={key} className="flex items-start gap-3">
              <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />
              <span>{t(`landing.ready.${key}`)}</span>
            </li>
          ))}
        </StatusList>
        <StatusList title={t('landing.statusNext')}>
          {NEXT.map((key) => (
            <li key={key} className="flex items-start gap-3 text-muted-foreground">
              <CircleDashed aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <span>{t(`landing.next.${key}`)}</span>
            </li>
          ))}
        </StatusList>
      </div>
    </section>
  );
}

export function Component() {
  const { t } = useTranslation();
  usePageTitle(undefined);
  return (
    <div className="min-h-dvh bg-background">
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {t('common.skipToContent')}
      </a>
      <LandingHeader />
      <main id="main">
        <Hero />
        <StatsStrip />
        <TracksSection />
        <HowSection />
        <PrinciplesSection />
        <PlanSection />
        <StatusSection />
      </main>
      <footer className="border-t">
        <div className={cn(SECTION, 'flex flex-wrap items-center justify-between gap-3 py-8 text-sm text-muted-foreground')}>
          <p>{t('landing.footer')}</p>
          <Button asChild variant="ghost" size="sm">
            <Link to="/dashboard">
              {t('landing.ctaPrimary')}
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </footer>
    </div>
  );
}
