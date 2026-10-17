import type { AttemptKind, CaseResult, HarnessTest } from '@dlos/shared';
import { Badge, cn } from '@dlos/ui';
import { CircleAlert, CircleCheck, CircleX, Clock, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { RunOutcome } from './runner';

function Field({ label, children }: { label: string; children: string }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd>
        <pre className="max-h-40 overflow-auto rounded-md bg-muted px-2.5 py-1.5 font-mono text-xs break-all whitespace-pre-wrap">{children}</pre>
      </dd>
    </div>
  );
}

function CaseRow({ result, open }: { result: CaseResult; open: boolean }) {
  const { t } = useTranslation();
  return (
    <details open={open} className="group rounded-lg border bg-card">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
        {result.passed ? (
          <CircleCheck aria-hidden="true" className="size-4 shrink-0 text-success" />
        ) : (
          <CircleX aria-hidden="true" className="size-4 shrink-0 text-destructive" />
        )}
        <span className="font-medium">{t('practice.testN', { n: result.index + 1 })}</span>
        {result.hidden ? <Badge variant="outline">{t('practice.hiddenTest')}</Badge> : null}
        <span className="sr-only">{result.passed ? t('practice.passedWord') : t('practice.failedWord')}</span>
        <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
          <Clock aria-hidden="true" className="size-3" />
          {result.timeMs < 1 ? '<1' : Math.round(result.timeMs)} ms
        </span>
      </summary>
      <dl className="space-y-2 border-t px-3 py-3">
        <Field label={t('practice.input')}>{result.args || '—'}</Field>
        <Field label={t('practice.expected')}>{result.expected}</Field>
        {result.error ? (
          <Field label={t('practice.error')}>{result.error}</Field>
        ) : (
          <Field label={t('practice.output')}>{result.actual}</Field>
        )}
        {result.logs.length > 0 ? <Field label={t('practice.console')}>{result.logs.join('\n')}</Field> : null}
      </dl>
    </details>
  );
}

export function ResultsPanel({
  outcome,
  running,
  kind,
  tests,
  className,
}: {
  outcome: RunOutcome | null;
  running: boolean;
  kind: AttemptKind | null;
  tests: readonly HarnessTest[];
  className?: string;
}) {
  const { t } = useTranslation();

  return (
    <section aria-label={t('practice.results')} aria-live="polite" className={cn('space-y-3 overflow-y-auto p-4', className)}>
      {running ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />
          {t('practice.running')}
        </p>
      ) : !outcome ? (
        <p className="text-sm text-muted-foreground">{t('practice.runFirst')}</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold tabular-nums">
              {outcome.compileError
                ? t('practice.cannotRun')
                : t('practice.testsPassed', { passed: outcome.passed, total: outcome.total })}
            </h3>
            {kind ? <Badge variant="secondary">{kind === 'submit' ? t('practice.submission') : t('practice.exampleRun')}</Badge> : null}
            {outcome.status === 'passed' ? <Badge variant="success">{t('practice.allPassed')}</Badge> : null}
          </div>

          {outcome.compileError ? (
            <div role="alert" className="flex gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
              <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-destructive" />
              <div className="min-w-0 space-y-1">
                <p className="font-medium">{t('practice.compileError')}</p>
                <pre className="font-mono text-xs break-words whitespace-pre-wrap">{outcome.compileError}</pre>
              </div>
            </div>
          ) : null}

          {outcome.timedOutAt !== null ? (
            <div role="alert" className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
              {t('practice.timeout', { n: outcome.timedOutAt + 1 })}
            </div>
          ) : null}

          <ul className="space-y-2">
            {tests.map((_test, index) => {
              const result = outcome.results.find((candidate) => candidate.index === index);
              if (!result) {
                return outcome.compileError ? null : (
                  <li key={index} className="rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground">
                    {t('practice.testN', { n: index + 1 })}: {t('practice.notRun')}
                  </li>
                );
              }
              const firstFailure = outcome.results.find((candidate) => !candidate.passed)?.index === index;
              return (
                <li key={index}>
                  <CaseRow result={result} open={firstFailure} />
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
