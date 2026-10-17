import type { TrackSummary } from '@dlos/shared';
import { Button, ProgressBar, Skeleton } from '@dlos/ui';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { ContentStatusBadge } from '../../components/badges';
import { PageContainer, PageHeader, QueryBoundary } from '../../components/page';
import { roundHours, useFormatters } from '../../lib/format';
import { useTracks } from '../../lib/queries';
import { TRACK_STYLE } from '../../lib/tracks';

export function TrackStats({ track }: { track: TrackSummary }) {
  const { t } = useTranslation();
  const format = useFormatters();
  const { stats } = track;
  const items = [
    { label: t('learn.courses', { value: format.number(track.courseCount) }) },
    { label: t('learn.lessons', { value: format.number(stats.lessonCount) }) },
    { label: t('learn.written', { done: format.number(stats.completeLessonCount), total: format.number(stats.lessonCount) }) },
    {
      label: t('learn.hours', {
        value: format.number(roundHours(stats.estimatedMinutes), { maximumFractionDigits: 0 }),
      }),
    },
  ];
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
      {items.map((item) => (
        <li key={item.label}>{item.label}</li>
      ))}
    </ul>
  );
}

function TrackCard({ track }: { track: TrackSummary }) {
  const { t } = useTranslation();
  const style = TRACK_STYLE[track.slug];
  const Icon = style.icon;
  const { stats } = track;
  const progress = stats.lessonCount > 0 ? (stats.completedByUser / stats.lessonCount) * 100 : 0;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border bg-card shadow-card">
      <div className="flex items-center gap-3 p-5 text-white" style={{ background: style.gradient }}>
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
          <Icon aria-hidden="true" className="size-6" />
        </span>
        <h2 className="text-lg leading-snug font-semibold tracking-tight">{track.title}</h2>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <p className="text-sm text-muted-foreground">{track.description}</p>
        <TrackStats track={track} />
        <div className="space-y-2">
          <ProgressBar value={progress} label={track.title} className="h-1.5" />
          <div className="flex items-center justify-between gap-2">
            <ContentStatusBadge status={track.contentStatus} />
            <span className="text-xs text-muted-foreground">
              {t('learn.completed', { value: stats.completedByUser })}
            </span>
          </div>
        </div>
        <Button asChild className="mt-auto w-full" variant="outline">
          <Link to={`/learn/${track.slug}`}>
            {t('learn.openTrack')}
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </article>
  );
}

export function Component() {
  const { t } = useTranslation();
  const tracks = useTracks();
  return (
    <PageContainer>
      <PageHeader title={t('learn.title')} description={t('learn.subtitle')} />
      <QueryBoundary
        query={tracks}
        skeleton={
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-80" />
            ))}
          </div>
        }
      >
        {(data) => (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 lg:gap-6">
            {data.tracks.map((track) => (
              <TrackCard key={track.slug} track={track} />
            ))}
          </div>
        )}
      </QueryBoundary>
      <p className="text-sm text-muted-foreground">{t('learn.contentNote')}</p>
    </PageContainer>
  );
}
