import type { AttemptKind, PracticeLanguage, ProblemDetail } from '@dlos/shared';
import {
  Badge,
  Button,
  Card,
  CardContent,
  NativeSelect,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  cn,
  toast,
} from '@dlos/ui';
import { ArrowRight, ChevronLeft, Eye, Lightbulb, Play, RotateCcw, Send } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import { Markdown } from '../../components/markdown';
import { PageContainer, QueryBoundary } from '../../components/page';
import { VideoPlayer } from '../../components/video-player';
import { useAutoStudyTimer } from '../../lib/auto-study';
import { useFormatters } from '../../lib/format';
import { usePageTitle } from '../../lib/hooks';
import { useCreateAttempt, useProblem } from '../../lib/queries';
import { ConfirmDialog } from '../roadmap/task-dialogs';
import { CodeEditor } from './code-editor';
import { clearDraft, loadDraft, loadLanguage, saveDraft, saveLanguage } from './drafts';
import { DifficultyPill, ProblemStatusIcon } from './problem-status';
import { ResultsPanel } from './results-panel';
import { runInWorker, type RunOutcome } from './runner';

function Statement({ problem }: { problem: ProblemDetail['problem'] }) {
  const { t } = useTranslation();
  const walkthrough = problem.videos[0];
  return (
    <div className="space-y-5">
      <Markdown source={problem.statement} className="prose-sm sm:prose-base" />
      <section className="space-y-3">
        <h3 className="text-sm font-semibold">{t('practice.examples')}</h3>
        {problem.examples.map((example, index) => (
          <div key={index} className="space-y-1.5 rounded-lg border bg-muted/40 p-3 text-sm">
            <p>
              <span className="font-medium">{t('practice.input')}: </span>
              <code className="font-mono text-[0.8125rem]">{example.input}</code>
            </p>
            <p>
              <span className="font-medium">{t('practice.output')}: </span>
              <code className="font-mono text-[0.8125rem]">{example.output}</code>
            </p>
            {example.explanation ? <p className="text-muted-foreground">{example.explanation}</p> : null}
          </div>
        ))}
      </section>
      {problem.constraints ? (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold">{t('practice.constraints')}</h3>
          <Markdown source={problem.constraints} className="prose-sm" />
        </section>
      ) : null}
      {walkthrough ? (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">{t('practice.walkthroughVideo')}</h3>
          <VideoPlayer video={walkthrough} />
        </section>
      ) : null}
    </div>
  );
}

function Hints({ hints }: { hints: string[] }) {
  const { t } = useTranslation();
  const [shown, setShown] = useState(0);
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{t('practice.hintsIntro')}</p>
      <ol className="space-y-2">
        {hints.slice(0, shown).map((hint, index) => (
          <li key={index} className="flex gap-3 rounded-lg border bg-muted/40 p-3 text-sm">
            <Lightbulb aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
            <span>
              <span className="font-medium">{t('practice.hintN', { n: index + 1 })}: </span>
              {hint}
            </span>
          </li>
        ))}
      </ol>
      {shown < hints.length ? (
        <Button variant="outline" size="sm" onClick={() => setShown((count) => count + 1)}>
          <Lightbulb aria-hidden="true" />
          {t('practice.showHint', { n: shown + 1, total: hints.length })}
        </Button>
      ) : (
        <p className="text-sm text-muted-foreground">{t('practice.noMoreHints')}</p>
      )}
    </div>
  );
}

function Solution({ solution, language }: { solution: NonNullable<ProblemDetail['problem']['solution']>; language: PracticeLanguage }) {
  const { t } = useTranslation();
  const [revealed, setRevealed] = useState(false);
  if (!revealed) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">{t('practice.solutionWarning')}</p>
        <Button variant="outline" onClick={() => setRevealed(true)}>
          <Eye aria-hidden="true" />
          {t('practice.showSolution')}
        </Button>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <Markdown source={solution.explanation} className="prose-sm" />
      <Markdown source={`\`\`\`${language === 'typescript' ? 'ts' : 'js'}\n${solution.code.trim()}\n\`\`\``} className="prose-sm" />
      <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <div className="flex gap-2">
          <dt className="text-muted-foreground">{t('practice.timeComplexity')}</dt>
          <dd className="font-mono">{solution.timeComplexity}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-muted-foreground">{t('practice.spaceComplexity')}</dt>
          <dd className="font-mono">{solution.spaceComplexity}</dd>
        </div>
      </dl>
    </div>
  );
}

function History({ attempts }: { attempts: ProblemDetail['recentAttempts'] }) {
  const { t } = useTranslation();
  const format = useFormatters();
  if (attempts.length === 0) return <p className="text-sm text-muted-foreground">{t('practice.noHistory')}</p>;
  return (
    <ul className="space-y-2">
      {attempts.map((attempt) => (
        <li key={attempt.id} className="flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-sm">
          <Badge variant={attempt.status === 'passed' ? 'success' : 'secondary'}>{t(`practice.attemptStatus.${attempt.status}`)}</Badge>
          <span className="tabular-nums">
            {attempt.passedCount}/{attempt.totalCount}
          </span>
          <span className="text-muted-foreground">{attempt.kind === 'submit' ? t('practice.submission') : t('practice.exampleRun')}</span>
          <span className="ml-auto text-xs text-muted-foreground">{format.dateTime(attempt.createdAt)}</span>
        </li>
      ))}
    </ul>
  );
}

type Pane = 'problem' | 'code' | 'results';

function Workspace({ data }: { data: ProblemDetail }) {
  const { t } = useTranslation();
  const { problem } = data;
  usePageTitle(problem.title);
  useAutoStudyTimer({ trackSlug: 'dsa' });
  const createAttempt = useCreateAttempt();

  const [language, setLanguage] = useState<PracticeLanguage>(loadLanguage);
  const starter = problem.starterCode[language];
  const [code, setCode] = useState(() => {
    const draft = loadDraft(problem.slug, language);
    if (draft !== null) return draft;
    if (data.latestCode?.language === language) return data.latestCode.code;
    return starter;
  });
  const [pane, setPane] = useState<Pane>('problem');
  const [running, setRunning] = useState(false);
  const [kind, setKind] = useState<AttemptKind | null>(null);
  const [outcome, setOutcome] = useState<RunOutcome | null>(null);
  const [visibleTests, setVisibleTests] = useState(problem.tests);
  const [confirmReset, setConfirmReset] = useState(false);
  const busy = useRef(false);

  // Keep what has been typed so a refresh never loses work.
  useEffect(() => {
    const id = window.setTimeout(() => saveDraft(problem.slug, language, code), 400);
    return () => window.clearTimeout(id);
  }, [problem.slug, language, code]);

  const changeLanguage = (next: PracticeLanguage) => {
    saveDraft(problem.slug, language, code);
    saveLanguage(next);
    setLanguage(next);
    const draft = loadDraft(problem.slug, next);
    setCode(draft ?? (data.latestCode?.language === next ? data.latestCode.code : problem.starterCode[next]));
    setOutcome(null);
  };

  const execute = useCallback(
    async (attemptKind: AttemptKind) => {
      if (busy.current) return;
      busy.current = true;
      setRunning(true);
      setKind(attemptKind);
      setPane('results');
      const tests = (attemptKind === 'run' ? problem.tests.filter((test) => !test.hidden) : problem.tests).map((test) => ({
        args: test.args,
        expected: test.expected,
        hidden: test.hidden ?? false,
      }));
      setVisibleTests(tests);
      try {
        const result = await runInWorker({
          code,
          language,
          config: { functionName: problem.functionName, ...problem.harness },
          tests,
        });
        setOutcome(result);
        createAttempt.mutate(
          {
            slug: problem.slug,
            attempt: {
              language,
              kind: attemptKind,
              code,
              status: result.status,
              passedCount: result.passed,
              totalCount: result.total,
              runtimeMs: result.runtimeMs,
            },
          },
          {
            onSuccess: (saved) => {
              if (saved.firstSolve) toast.success(t('practice.solvedToast'));
            },
          },
        );
      } finally {
        busy.current = false;
        setRunning(false);
      }
    },
    [code, language, problem, createAttempt, t],
  );

  const solved = problem.status === 'solved' || (kind === 'submit' && outcome?.status === 'passed');

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <Link to="/practice" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground hover:underline">
            <ChevronLeft aria-hidden="true" className="size-4" />
            {t('practice.backToList')}
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <ProblemStatusIcon status={solved ? 'solved' : problem.status} />
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{problem.title}</h1>
            <DifficultyPill difficulty={problem.difficulty} />
            {problem.topics.map((topic) => (
              <Badge key={topic} variant="outline">
                {topic}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
          {problem.lessonSlug ? (
            <Button asChild variant="ghost" size="sm" className="h-auto max-w-full min-w-0 py-1.5 text-left whitespace-normal">
              <Link to={`/lessons/${problem.lessonSlug}`}>{data.lesson?.title ?? t('practice.relatedLesson')}</Link>
            </Button>
          ) : null}
          {data.next ? (
            <Button asChild variant="outline" size="sm">
              <Link to={`/practice/${data.next.slug}`}>
                {t('practice.nextProblem')}
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          ) : null}
        </div>
      </header>

      {solved ? (
        <p role="status" className="rounded-xl border border-success/40 bg-success/10 px-4 py-2 text-sm">
          {t('practice.solvedBanner')}
        </p>
      ) : null}

      <div role="tablist" aria-label={t('practice.panes')} className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1 lg:hidden">
        {(['problem', 'code', 'results'] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={pane === value}
            onClick={() => setPane(value)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40',
              pane === value ? 'bg-card shadow-card' : 'text-muted-foreground',
            )}
          >
            {t(`practice.pane.${value}`)}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:h-[calc(100dvh-13rem)] lg:min-h-[32rem] lg:grid-cols-2">
        <Card className={cn('min-h-0 gap-0 overflow-hidden py-0', pane === 'problem' ? 'flex' : 'hidden lg:flex')}>
          <CardContent className="flex min-h-0 flex-1 flex-col px-0">
            <Tabs defaultValue="description" className="flex min-h-0 flex-1 flex-col">
              <TabsList className="m-3 mb-0 w-fit">
                <TabsTrigger value="description">{t('practice.tab.description')}</TabsTrigger>
                <TabsTrigger value="hints">{t('practice.tab.hints')}</TabsTrigger>
                <TabsTrigger value="solution">{t('practice.tab.solution')}</TabsTrigger>
                <TabsTrigger value="history">{t('practice.tab.history')}</TabsTrigger>
              </TabsList>
              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                <TabsContent value="description">
                  <Statement problem={problem} />
                </TabsContent>
                <TabsContent value="hints">
                  <Hints hints={problem.hints} />
                </TabsContent>
                <TabsContent value="solution">
                  {problem.solution ? <Solution solution={problem.solution} language={language} /> : <p className="text-sm text-muted-foreground">{t('practice.noSolution')}</p>}
                </TabsContent>
                <TabsContent value="history">
                  <History attempts={data.recentAttempts} />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>

        <div className={cn('min-h-0 flex-col gap-4', pane === 'problem' ? 'hidden lg:flex' : 'flex')}>
          <Card className={cn('min-h-[22rem] flex-1 gap-0 overflow-hidden py-0', pane === 'results' ? 'hidden lg:flex' : 'flex')}>
            <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2">
              <NativeSelect
                aria-label={t('practice.language')}
                value={language}
                onChange={(event) => changeLanguage(event.target.value as PracticeLanguage)}
                className="h-9 w-auto min-w-36"
              >
                <option value="typescript">TypeScript</option>
                <option value="javascript">JavaScript</option>
              </NativeSelect>
              <Button variant="ghost" size="sm" onClick={() => setConfirmReset(true)}>
                <RotateCcw aria-hidden="true" />
                {t('practice.reset')}
              </Button>
              <div className="ml-auto flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => void execute('run')} disabled={running} title={t('practice.runHint')}>
                  <Play aria-hidden="true" />
                  {t('practice.run')}
                </Button>
                <Button size="sm" onClick={() => void execute('submit')} disabled={running} title={t('practice.submitHint')}>
                  <Send aria-hidden="true" />
                  {t('practice.submit')}
                </Button>
              </div>
            </div>
            <CodeEditor
              value={code}
              language={language}
              label={t('practice.editorLabel')}
              onChange={setCode}
              onRun={() => void execute('run')}
              onSubmit={() => void execute('submit')}
              className="min-h-0 flex-1"
            />
            <p className="border-t px-3 py-1.5 text-xs text-muted-foreground">{t('practice.editorHint')}</p>
          </Card>

          <Card className={cn('min-h-40 gap-0 overflow-hidden py-0 lg:h-[38%]', pane === 'code' ? 'hidden lg:flex' : 'flex')}>
            <ResultsPanel outcome={outcome} running={running} kind={kind} tests={visibleTests} className="min-h-0 w-full flex-1" />
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title={t('practice.resetTitle')}
        description={t('practice.resetBody')}
        confirmLabel={t('practice.resetConfirm')}
        onConfirm={() => {
          clearDraft(problem.slug, language);
          setCode(starter);
          setOutcome(null);
          setConfirmReset(false);
        }}
      />
    </>
  );
}

export function Component() {
  const { slug = '' } = useParams();
  const problem = useProblem(slug);
  return (
    <PageContainer wide>
      <QueryBoundary
        query={problem}
        skeleton={
          <div className="space-y-4" aria-hidden="true">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-96" />
          </div>
        }
      >
        {(data) => <Workspace key={`${data.problem.slug}`} data={data} />}
      </QueryBoundary>
    </PageContainer>
  );
}
