import { extractHeadings, type LessonDetail, type LessonVideo } from '@dlos/shared';
import {
  Badge,
  Button,
  Card,
  CardContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Skeleton,
  cn,
  toast,
} from '@dlos/ui';
import {
  ArrowLeft,
  ArrowRight,
  CircleCheck,
  Download,
  FileText,
  Info,
  Printer,
  RotateCcw,
  Timer,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router';
import { ContentStatusBadge, DifficultyBadge, TrackBadge } from '../../components/badges';
import { Markdown } from '../../components/markdown';
import { PageContainer, PageHeader, QueryBoundary } from '../../components/page';
import { QuizCard } from '../../components/quiz-card';
import { VideoPlayer } from '../../components/video-player';
import { useAutoStudyTimer } from '../../lib/auto-study';
import { downloadTextFile, fileSafe } from '../../lib/download';
import { useLesson, useSetLessonProgress } from '../../lib/queries';
import { useOverlayStore } from '../../stores/overlay-store';
import { useUiStore } from '../../stores/ui-store';
import { DifficultyPill, ProblemStatusIcon } from '../practice/problem-status';

function lessonToMarkdown(data: LessonDetail): string {
  const { lesson, course, content, videos } = data;
  const lines = [`# ${lesson.title}`, '', `> ${course.title} · ${data.module.title}`, '', content?.bodyMarkdown ?? '', ''];
  if (videos.length > 0) {
    lines.push('## Videos', '', ...videos.map((video) => `- [${video.title}](${video.watchUrl}) (${video.author})`), '');
  }
  return lines.join('\n');
}

function Videos({ videos }: { videos: LessonVideo[] }) {
  const { t } = useTranslation();
  const locale = useUiStore((state) => state.locale);
  const ordered = useMemo(() => {
    const preferred = locale === 'en' ? 'en' : 'hi';
    return [...videos].sort((a, b) => Number(b.language === preferred) - Number(a.language === preferred));
  }, [videos, locale]);
  const [active, setActive] = useState(0);
  const current = ordered[Math.min(active, ordered.length - 1)];
  if (!current) return null;

  const languageLabel = (video: LessonVideo) =>
    video.language === 'hi' ? t('lesson.videoHindi') : video.language === 'en' ? t('lesson.videoEnglish') : t('lesson.videoMulti');

  return (
    <section aria-labelledby="lesson-watch" className="space-y-3 print:hidden">
      <h2 id="lesson-watch" className="text-lg font-semibold tracking-tight">
        {t('lesson.watch')}
      </h2>
      <VideoPlayer key={current.id} video={current} />
      {ordered.length > 1 ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{t('lesson.moreVideos')}</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {ordered.map((video, index) => (
              <li key={video.id}>
                <button
                  type="button"
                  onClick={() => setActive(index)}
                  aria-pressed={index === active}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-xl border bg-card p-3 text-left text-sm outline-none transition-colors hover:bg-accent/40 focus-visible:ring-[3px] focus-visible:ring-ring/40',
                    index === active && 'border-primary bg-accent',
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 font-medium">{video.title}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{video.author}</span>
                  </span>
                  <Badge variant="outline" className="shrink-0">
                    {languageLabel(video)}
                  </Badge>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{languageLabel(current)}</p>
      )}
    </section>
  );
}

function PracticeList({ practice }: { practice: LessonDetail['practice'] }) {
  const { t } = useTranslation();
  return (
    <Card className="print:hidden">
      <CardContent className="space-y-3">
        <div>
          <h2 className="font-semibold">{t('lesson.practiceTitle')}</h2>
          <p className="text-sm text-muted-foreground">{t('lesson.practiceBody')}</p>
        </div>
        <ul className="grid gap-2">
          {practice.map((problem) => (
            <li key={problem.slug}>
              <Link
                to={`/practice/${problem.slug}`}
                className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm outline-none transition-colors hover:bg-accent/40 focus-visible:ring-[3px] focus-visible:ring-ring/40"
              >
                <ProblemStatusIcon status={problem.status} />
                <span className="min-w-0 flex-1 font-medium">{problem.title}</span>
                <DifficultyPill difficulty={problem.difficulty} />
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function LessonContent({ data }: { data: LessonDetail }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const openLogSession = useOverlayStore((state) => state.openLogSession);
  const setProgress = useSetLessonProgress();
  const { lesson, course, content } = data;
  const ready = lesson.contentStatus === 'complete' && content !== null;
  const completed = lesson.progress === 'completed';
  const headings = useMemo(
    () => (content ? extractHeadings(content.bodyMarkdown).filter((heading) => heading.level === 2) : []),
    [content],
  );

  useAutoStudyTimer(ready ? { trackSlug: course.trackSlug, lessonSlug: lesson.slug } : null);

  // Opening a lesson with content starts it, so "continue learning" always knows where you are.
  const startedFor = useRef<string | null>(null);
  const { mutate } = setProgress;
  useEffect(() => {
    if (!ready || lesson.progress !== 'not_started' || startedFor.current === lesson.slug) return;
    startedFor.current = lesson.slug;
    mutate({ slug: lesson.slug, status: 'in_progress' });
  }, [ready, lesson.slug, lesson.progress, mutate]);

  const toggleComplete = () =>
    setProgress.mutate(
      { slug: lesson.slug, status: completed ? 'not_started' : 'completed' },
      {
        onSuccess: () => {
          if (completed) return;
          const next = data.next;
          toast.success(t('lesson.completedToast'), {
            ...(next ? { action: { label: t('lesson.next'), onClick: () => void navigate(`/lessons/${next.slug}`) } } : {}),
          });
        },
        onError: () => toast.error(t('common.errorTitle')),
      },
    );

  const completeButton = ready ? (
    <Button variant={completed ? 'outline' : 'default'} onClick={toggleComplete} disabled={setProgress.isPending} aria-pressed={completed}>
      {completed ? <RotateCcw aria-hidden="true" /> : <CircleCheck aria-hidden="true" />}
      {completed ? t('lesson.markNotDone') : t('lesson.markComplete')}
    </Button>
  ) : null;

  return (
    <>
      <PageHeader
        title={lesson.title}
        eyebrow={
          <Link to={`/courses/${course.slug}`} className="hover:text-foreground hover:underline">
            {t('lesson.inCourse', { course: course.title })} · {data.module.title}
          </Link>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            {completeButton}
            {ready ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Download aria-hidden="true" />
                    {t('lesson.download')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onSelect={() => downloadTextFile(`${fileSafe(lesson.title)}.md`, lessonToMarkdown(data), 'text/markdown;charset=utf-8')}
                  >
                    <FileText aria-hidden="true" />
                    {t('lesson.downloadMarkdown')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => window.print()}>
                    <Printer aria-hidden="true" />
                    {t('lesson.downloadPdf')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
            <Button variant="ghost" onClick={() => openLogSession({ trackSlug: course.trackSlug, lessonSlug: lesson.slug })}>
              <Timer aria-hidden="true" />
              {t('lesson.study')}
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <TrackBadge track={course.trackSlug} />
        <DifficultyBadge difficulty={lesson.difficulty} />
        {lesson.kind !== 'lesson' ? <Badge variant="secondary">{t(`lessonKind.${lesson.kind}`)}</Badge> : null}
        <ContentStatusBadge status={lesson.contentStatus} />
        {completed ? <Badge variant="success">{t('progressStatus.completed')}</Badge> : null}
        <span className="text-sm text-muted-foreground">{t('lesson.minutes', { value: lesson.estimatedMinutes })}</span>
      </div>

      {!ready ? (
        <Card className="border-info/30 bg-info/5">
          <CardContent className="flex gap-4">
            <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-info" />
            <div className="space-y-1">
              <h2 className="font-semibold">{t('lesson.statusTitle')}</h2>
              <p className="text-sm text-muted-foreground">{t('lesson.statusBody')}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Videos videos={data.videos} />

          <div className={cn('grid gap-8', headings.length > 2 && 'xl:grid-cols-[minmax(0,1fr)_15rem]')}>
            <article aria-label={lesson.title} className="min-w-0 space-y-8">
              {content.isFallback ? <p className="text-sm text-muted-foreground print:hidden">{t('lesson.fallbackNotice')}</p> : null}
              <Markdown source={content.bodyMarkdown} />
              {data.practice.length > 0 ? <PracticeList practice={data.practice} /> : null}
              {data.quiz ? <QuizCard summary={data.quiz} /> : null}
              {completeButton ? <div className="flex flex-wrap items-center gap-3 border-t pt-6 print:hidden">{completeButton}</div> : null}
            </article>
            {headings.length > 2 ? (
              <aside className="hidden xl:block print:hidden">
                <nav aria-label={t('lesson.onThisPage')} className="sticky top-24 space-y-2 text-sm">
                  <p className="font-semibold">{t('lesson.onThisPage')}</p>
                  <ul className="space-y-1.5 border-l pl-3">
                    {headings.map((heading) => (
                      <li key={heading.id}>
                        <a href={`#${heading.id}`} className="text-muted-foreground hover:text-foreground hover:underline">
                          {heading.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </aside>
            ) : null}
          </div>
        </>
      )}

      <nav aria-label={t('lesson.title')} className="grid grid-cols-1 gap-3 sm:grid-cols-2 print:hidden">
        {data.previous ? (
          <Link
            to={`/lessons/${data.previous.slug}`}
            className="flex min-w-0 items-center gap-3 rounded-xl border bg-card p-4 shadow-card transition-colors hover:bg-accent/40"
          >
            <ArrowLeft aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
            <span className="min-w-0">
              <span className="block text-xs text-muted-foreground">{t('lesson.previous')}</span>
              <span className="block truncate font-medium">{data.previous.title}</span>
            </span>
          </Link>
        ) : (
          <span />
        )}
        {data.next ? (
          <Link
            to={`/lessons/${data.next.slug}`}
            className="flex min-w-0 items-center justify-end gap-3 rounded-xl border bg-card p-4 text-right shadow-card transition-colors hover:bg-accent/40"
          >
            <span className="min-w-0">
              <span className="block text-xs text-muted-foreground">{t('lesson.next')}</span>
              <span className="block truncate font-medium">{data.next.title}</span>
            </span>
            <ArrowRight aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
          </Link>
        ) : (
          <Button asChild variant="outline" className="h-auto justify-center py-4 sm:col-start-2">
            <Link to={`/courses/${course.slug}`}>{t('lesson.backToCourse')}</Link>
          </Button>
        )}
      </nav>
    </>
  );
}

export function Component() {
  const { slug = '' } = useParams();
  const lesson = useLesson(slug);
  return (
    <PageContainer>
      <QueryBoundary
        query={lesson}
        skeleton={
          <div className="space-y-6" aria-hidden="true">
            <Skeleton className="h-12 w-2/3" />
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="aspect-video w-full max-w-3xl" />
          </div>
        }
      >
        {(data) => <LessonContent data={data} />}
      </QueryBoundary>
    </PageContainer>
  );
}
