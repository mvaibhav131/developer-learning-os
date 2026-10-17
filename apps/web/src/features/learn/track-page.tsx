import { TRACK_SLUGS, type TrackSlug } from '@dlos/shared';
import { Skeleton } from '@dlos/ui';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { CourseCard } from '../../components/course-card';
import { PageContainer, PageHeader, QueryBoundary } from '../../components/page';
import { useTrack } from '../../lib/queries';
import { TRACK_STYLE } from '../../lib/tracks';
import { Component as NotFound } from '../not-found/not-found-page';
import { TrackStats } from './learn-page';

function TrackContent({ slug }: { slug: TrackSlug }) {
  const { t } = useTranslation();
  const track = useTrack(slug);
  const style = TRACK_STYLE[slug];
  const Icon = style.icon;

  return (
    <PageContainer>
      <QueryBoundary
        query={track}
        skeleton={
          <div className="space-y-6" aria-hidden="true">
            <Skeleton className="h-40" />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }, (_, index) => (
                <Skeleton key={index} className="h-80" />
              ))}
            </div>
          </div>
        }
      >
        {(data) => (
          <>
            <PageHeader
              title={data.track.title}
              description={data.track.description}
              eyebrow={
                <span className="inline-flex items-center gap-2">
                  <span
                    className="flex size-8 items-center justify-center rounded-lg text-white"
                    style={{ background: style.gradient }}
                  >
                    <Icon aria-hidden="true" className="size-4" />
                  </span>
                  <TrackStats track={data.track} />
                </span>
              }
            />
            <section aria-label={t('nav.items.courses')}>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 lg:gap-6">
                {data.courses.map((course) => (
                  <CourseCard key={course.slug} course={course} />
                ))}
              </div>
            </section>
            <p className="text-sm text-muted-foreground">{t('learn.contentNote')}</p>
          </>
        )}
      </QueryBoundary>
    </PageContainer>
  );
}

export function Component() {
  const { track } = useParams();
  const slug = TRACK_SLUGS.find((candidate) => candidate === track);
  if (!slug) return <NotFound />;
  return <TrackContent slug={slug} />;
}
