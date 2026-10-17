import { DIFFICULTIES, TRACK_SLUGS } from '@dlos/shared';
import { Button, EmptyState, Input, Label, NativeSelect, Skeleton, cn } from '@dlos/ui';
import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { CourseCard } from '../../components/course-card';
import { PageContainer, PageHeader, QueryBoundary } from '../../components/page';
import { useDebouncedValue } from '../../lib/hooks';
import { useFormatters } from '../../lib/format';
import { useCourses } from '../../lib/queries';
import { TRACK_STYLE } from '../../lib/tracks';

export function Component() {
  const { t } = useTranslation();
  const format = useFormatters();
  const [params, setParams] = useSearchParams();

  const track = TRACK_SLUGS.find((slug) => slug === params.get('track'));
  const difficulty = DIFFICULTIES.find((level) => level === params.get('difficulty'));
  const urlQuery = params.get('q') ?? '';
  const [text, setText] = useState(urlQuery);
  const debounced = useDebouncedValue(text, 250);

  useEffect(() => {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (debounced.trim()) next.set('q', debounced.trim());
        else next.delete('q');
        return next;
      },
      { replace: true },
    );
  }, [debounced, setParams]);

  const setFilter = (key: 'track' | 'difficulty', value: string | undefined) =>
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );

  const courses = useCourses({
    track,
    difficulty,
    q: debounced.trim() || undefined,
  });
  const hasFilters = Boolean(track ?? difficulty ?? debounced.trim());
  const clearFilters = () => {
    setText('');
    setParams({}, { replace: true });
  };

  return (
    <PageContainer>
      <PageHeader title={t('courses.title')} description={t('courses.subtitle')} />

      <section aria-label={t('courses.search')} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_14rem]">
          <div className="grid gap-1.5">
            <Label htmlFor="course-search">{t('courses.search')}</Label>
            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="course-search"
                type="search"
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder={t('courses.searchPlaceholder')}
                className="pl-9"
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="course-difficulty">{t('courses.difficulty')}</Label>
            <NativeSelect
              id="course-difficulty"
              value={difficulty ?? ''}
              onChange={(event) => setFilter('difficulty', event.target.value || undefined)}
            >
              <option value="">{t('courses.allDifficulties')}</option>
              {DIFFICULTIES.map((level) => (
                <option key={level} value={level}>
                  {t(`difficulty.${level}`)}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>

        <div role="group" aria-label={t('courses.track')} className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={track ? 'outline' : 'default'}
            aria-pressed={!track}
            onClick={() => setFilter('track', undefined)}
          >
            {t('courses.allTracks')}
          </Button>
          {TRACK_SLUGS.map((slug) => {
            const Icon = TRACK_STYLE[slug].icon;
            return (
              <Button
                key={slug}
                size="sm"
                variant={track === slug ? 'default' : 'outline'}
                aria-pressed={track === slug}
                onClick={() => setFilter('track', slug)}
              >
                <Icon aria-hidden="true" className={cn(track === slug ? '' : TRACK_STYLE[slug].text)} />
                {t(`tracks.${slug}`)}
              </Button>
            );
          })}
          {hasFilters ? (
            <Button size="sm" variant="ghost" onClick={clearFilters}>
              {t('courses.clear')}
            </Button>
          ) : null}
        </div>
      </section>

      <QueryBoundary
        query={courses}
        skeleton={
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-80" />
            ))}
          </div>
        }
      >
        {(data) => (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {t('courses.results', { value: format.number(data.courses.length) })}
            </p>
            {data.courses.length === 0 ? (
              <EmptyState title={t('courses.empty')} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 lg:gap-6">
                {data.courses.map((course) => (
                  <CourseCard key={course.slug} course={course} />
                ))}
              </div>
            )}
          </div>
        )}
      </QueryBoundary>
    </PageContainer>
  );
}
