import type { QuizQuestion, QuizResult, QuizSummary } from '@dlos/shared';
import { Badge, Button, Card, CardContent, ErrorState, Skeleton, cn } from '@dlos/ui';
import { CircleCheck, CircleX, ListChecks } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuiz, useSubmitQuiz } from '../lib/queries';

type Answers = Record<string, string[]>;

function OptionInput({
  question,
  option,
  checked,
  disabled,
  mark,
  groupName,
  onToggle,
}: {
  question: QuizQuestion;
  option: QuizQuestion['options'][number];
  checked: boolean;
  disabled: boolean;
  mark: 'correct' | 'missed' | 'wrong' | null;
  groupName: string;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  const type = question.kind === 'multiple' ? 'checkbox' : 'radio';
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-xl border bg-card px-4 py-3 text-sm transition-colors hover:bg-accent/40',
        'has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/40',
        checked && !mark && 'border-primary bg-accent',
        mark === 'correct' && 'border-success/60 bg-success/10',
        mark === 'wrong' && 'border-destructive/60 bg-destructive/10',
        mark === 'missed' && 'border-success/60 border-dashed',
        disabled && 'cursor-default hover:bg-card',
      )}
    >
      <input
        type={type}
        name={groupName}
        checked={checked}
        disabled={disabled}
        onChange={onToggle}
        className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]"
      />
      <span className="min-w-0 flex-1">{option.text}</span>
      {mark === 'correct' ? <span className="shrink-0 text-xs font-medium text-success">{t('quiz.correctAnswer')}</span> : null}
      {mark === 'missed' ? <span className="shrink-0 text-xs font-medium text-success">{t('quiz.missedAnswer')}</span> : null}
      {mark === 'wrong' ? <span className="shrink-0 text-xs font-medium text-destructive">{t('quiz.yourAnswer')}</span> : null}
    </label>
  );
}

function QuizForm({ slug, summary, onClose }: { slug: string; summary: QuizSummary; onClose: () => void }) {
  const { t } = useTranslation();
  const ids = useId();
  const quiz = useQuiz(slug);
  const submit = useSubmitQuiz();
  const [answers, setAnswers] = useState<Answers>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const startedAt = useRef(0);
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  if (quiz.isPending) return <Skeleton className="h-48 w-full" />;
  if (!quiz.data) {
    return (
      <ErrorState
        title={t('common.errorTitle')}
        description={t('common.errorBody')}
        retryLabel={t('common.retry')}
        onRetry={() => void quiz.refetch()}
      />
    );
  }

  const questions = quiz.data.questions;
  const graded = new Map(result?.results.map((item) => [item.questionId, item]));

  const toggle = (question: QuizQuestion, optionId: string) => {
    if (result) return;
    setError(null);
    setAnswers((previous) => {
      const current = previous[String(question.id)] ?? [];
      const next =
        question.kind === 'multiple'
          ? current.includes(optionId)
            ? current.filter((id) => id !== optionId)
            : [...current, optionId]
          : [optionId];
      return { ...previous, [String(question.id)]: next };
    });
  };

  const check = () => {
    if (questions.some((question) => (answers[String(question.id)] ?? []).length === 0)) {
      setError(t('quiz.answerAll'));
      return;
    }
    submit.mutate(
      { slug, body: { answers, durationSeconds: Math.round((Date.now() - startedAt.current) / 1000) } },
      { onSuccess: setResult, onError: () => setError(t('common.errorTitle')) },
    );
  };

  const retry = () => {
    setAnswers({});
    setResult(null);
    setError(null);
    startedAt.current = Date.now();
  };

  return (
    <div className="space-y-6">
      {result ? (
        <div
          role="status"
          className={cn(
            'rounded-xl border p-4 text-sm',
            result.attempt.passed ? 'border-success/40 bg-success/10' : 'border-warning/40 bg-warning/10',
          )}
        >
          <p className="text-base font-semibold tabular-nums">
            {t('quiz.score', { score: result.attempt.score, total: result.attempt.maxScore })} ({result.attempt.percent}%)
          </p>
          <p className="mt-1 text-muted-foreground">
            {result.attempt.passed ? t('quiz.passed', { percent: summary.passPercent }) : t('quiz.notPassed', { percent: summary.passPercent })}
          </p>
        </div>
      ) : null}

      <ol className="space-y-6">
        {questions.map((question, index) => {
          const key = String(question.id);
          const picked = answers[key] ?? [];
          const item = graded.get(question.id);
          return (
            <li key={question.id}>
              <fieldset className="space-y-3" disabled={submit.isPending}>
                <legend className="flex items-start gap-2 text-sm font-medium">
                  <span className="tabular-nums text-muted-foreground">{index + 1}.</span>
                  <span className="min-w-0 flex-1">{question.prompt}</span>
                  {item ? (
                    item.correct ? (
                      <span className="inline-flex shrink-0 items-center gap-1 text-xs text-success">
                        <CircleCheck aria-hidden="true" className="size-4" />
                        {t('quiz.correct')}
                      </span>
                    ) : (
                      <span className="inline-flex shrink-0 items-center gap-1 text-xs text-destructive">
                        <CircleX aria-hidden="true" className="size-4" />
                        {t('quiz.incorrect')}
                      </span>
                    )
                  ) : null}
                </legend>
                {question.kind === 'multiple' ? (
                  <p className="text-xs text-muted-foreground">{t('quiz.selectAll')}</p>
                ) : null}
                <div className="grid gap-2">
                  {question.options.map((option) => {
                    const isPicked = picked.includes(option.id);
                    const isCorrect = item?.correctOptionIds.includes(option.id) ?? false;
                    const mark = !item ? null : isCorrect ? (isPicked ? 'correct' : 'missed') : isPicked ? 'wrong' : null;
                    return (
                      <OptionInput
                        key={option.id}
                        question={question}
                        option={option}
                        checked={isPicked}
                        disabled={result !== null || submit.isPending}
                        mark={mark}
                        groupName={`${ids}-${question.id}`}
                        onToggle={() => toggle(question, option.id)}
                      />
                    );
                  })}
                </div>
                {item ? (
                  <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{t('quiz.why')} </span>
                    {item.explanation}
                  </p>
                ) : null}
              </fieldset>
            </li>
          );
        })}
      </ol>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {result ? (
          <Button onClick={retry}>{t('quiz.retry')}</Button>
        ) : (
          <Button onClick={check} disabled={submit.isPending}>
            {submit.isPending ? t('common.saving') : t('quiz.check')}
          </Button>
        )}
        <Button variant="ghost" onClick={onClose}>
          {t('quiz.close')}
        </Button>
      </div>
    </div>
  );
}

/** Short quiz at the end of a lesson. Answers are graded by the server, which also keeps the best score. */
export function QuizCard({ summary }: { summary: QuizSummary }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <Card className="print:hidden">
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <ListChecks aria-hidden="true" className="size-5 text-brand" />
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold">{summary.title}</h2>
            <p className="text-sm text-muted-foreground">
              {t('quiz.questions', { count: summary.questionCount })} · {t('quiz.passAt', { percent: summary.passPercent })}
            </p>
          </div>
          {summary.best ? (
            <Badge variant={summary.best.passed ? 'success' : 'secondary'}>
              {t('quiz.best', { percent: summary.best.percent })}
            </Badge>
          ) : null}
          {open ? null : <Button onClick={() => setOpen(true)}>{summary.best ? t('quiz.again') : t('quiz.start')}</Button>}
        </div>
        {open ? <QuizForm slug={summary.slug} summary={summary} onClose={() => setOpen(false)} /> : null}
      </CardContent>
    </Card>
  );
}
