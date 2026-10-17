import { PROBLEM_DIFFICULTIES, PROBLEM_STATUSES } from '@dlos/shared';
import { Badge, Button, Card, CardContent, EmptyState, Input, Label, NativeSelect, ProgressBar, Skeleton } from '@dlos/ui';
import { Search } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router';
import { PageContainer, PageHeader, QueryBoundary } from '../../components/page';
import { useDebouncedValue } from '../../lib/hooks';
import { useProblems } from '../../lib/queries';
import { DifficultyPill, ProblemStatusIcon } from './problem-status';

export function Component() {
  const { t } = useTranslation();
  const ids = useId();
  const [params, setParams] = useSearchParams();

  const topic = params.get('topic') ?? undefined;
  const difficulty = PROBLEM_DIFFICULTIES.find((value) => value === params.get('difficulty'));
  const status = PROBLEM_STATUSES.find((value) => value === params.get('status'));
  const [text, setText] = useState(params.get('q') ?? '');
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

  const setFilter = (key: 'topic' | 'difficulty' | 'status', value: string) =>
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );

  const problems = useProblems({ topic, difficulty, status, q: debounced.trim() || undefined });
  const hasFilters = Boolean(topic ?? difficulty ?? status ?? debounced.trim());

  return (
    <PageContainer>
      <PageHeader title={t('practice.title')} description={t('practice.subtitle')} />

      <QueryBoundary
        query={problems}
        skeleton={
          <div className="space-y-3" aria-hidden="true">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-16" />
            ))}
          </div>
        }
      >
        {(data) => (
          <>
            <Card>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('practice.progress')}</p>
                    <p className="text-2xl font-semibold tabular-nums">
                      {t('practice.solvedOf', { solved: data.summary.solved, total: data.summary.total })}
                    </p>
                  </div>
                  <ul className="flex flex-wrap gap-2 text-sm">
                    {PROBLEM_DIFFICULTIES.map((level) => (
                      <li key={level} className="flex items-center gap-2">
                        <DifficultyPill difficulty={level} />
                        <span className="tabular-nums text-muted-foreground">
                          {data.summary.byDifficulty[level].solved}/{data.summary.byDifficulty[level].total}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <ProgressBar
                  value={data.summary.total > 0 ? (data.summary.solved / data.summary.total) * 100 : 0}
                  label={t('practice.progress')}
                />
              </CardContent>
            </Card>

            <section aria-label={t('practice.filters')} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="grid gap-1.5 lg:col-span-1">
                <Label htmlFor={`${ids}-q`}>{t('practice.search')}</Label>
                <div className="relative">
                  <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id={`${ids}-q`} value={text} onChange={(event) => setText(event.target.value)} className="pl-9" placeholder={t('practice.searchPlaceholder')} />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor={`${ids}-topic`}>{t('practice.topic')}</Label>
                <NativeSelect id={`${ids}-topic`} value={topic ?? ''} onChange={(event) => setFilter('topic', event.target.value)}>
                  <option value="">{t('practice.allTopics')}</option>
                  {data.topics.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor={`${ids}-difficulty`}>{t('practice.difficultyLabel')}</Label>
                <NativeSelect id={`${ids}-difficulty`} value={difficulty ?? ''} onChange={(event) => setFilter('difficulty', event.target.value)}>
                  <option value="">{t('practice.allDifficulties')}</option>
                  {PROBLEM_DIFFICULTIES.map((level) => (
                    <option key={level} value={level}>
                      {t(`practice.difficulty.${level}`)}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor={`${ids}-status`}>{t('practice.statusLabel')}</Label>
                <NativeSelect id={`${ids}-status`} value={status ?? ''} onChange={(event) => setFilter('status', event.target.value)}>
                  <option value="">{t('practice.allStatuses')}</option>
                  {PROBLEM_STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {t(`practice.status.${value}`)}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            </section>

            {data.problems.length === 0 ? (
              <EmptyState
                title={t('practice.empty')}
                action={
                  hasFilters ? (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setText('');
                        setParams({}, { replace: true });
                      }}
                    >
                      {t('courses.clear')}
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <ul className="grid gap-2" aria-label={t('practice.title')}>
                {data.problems.map((problem) => (
                  <li key={problem.slug}>
                    <Link
                      to={`/practice/${problem.slug}`}
                      className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border bg-card px-4 py-3 shadow-card outline-none transition-colors hover:bg-accent/40 focus-visible:ring-[3px] focus-visible:ring-ring/40"
                    >
                      <ProblemStatusIcon status={problem.status} />
                      <span className="min-w-0 flex-1 basis-48 font-medium">{problem.title}</span>
                      <span className="flex flex-wrap items-center gap-1.5">
                        {problem.topics.slice(0, 3).map((name) => (
                          <Badge key={name} variant="outline">
                            {name}
                          </Badge>
                        ))}
                      </span>
                      <DifficultyPill difficulty={problem.difficulty} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </QueryBoundary>
    </PageContainer>
  );
}
