import type { CourseDetail, LessonSummary } from '@dlos/shared';
import { Badge, Button, Card, CardContent, ProgressBar, Skeleton } from '@dlos/ui';
import { ArrowRight, ChevronRight, CircleCheck, CircleDashed, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import { ContentStatusBadge, DifficultyBadge, TrackBadge } from '../../components/badges';
import { CourseThumbnail } from '../../components/course-thumbnail';
import { PageContainer, QueryBoundary } from '../../components/page';
import { usePageTitle } from '../../lib/hooks';
import { roundHours, useFormatters } from '../../lib/format';
import { useCourse } from '../../lib/queries';

function LessonRow({ lesson }: { lesson: LessonSummary }) {
  const { t } = useTranslation();
  const completed = lesson.progress === 'completed';
  const Icon = completed ? CircleCheck : CircleDashed;
  return (
    <li>
      <Link
        to={`/lessons/${lesson.slug}`}
        className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-3 py-2.5 text-sm outline-none transition-colors hover:bg-accent/50 focus-visible:ring-[3px] focus-visible:ring-ring/40"
      >
        <Icon
          aria-hidden="true"
          className={completed ? 'size-4 shrink-0 text-success' : 'size-4 shrink-0 text-muted-foreground'}
        />
        <span className="min-w-0 flex-1 basis-48 font-medium">{lesson.title}</span>
        <span className="flex flex-wrap items-center gap-2">
          {lesson.kind !== 'lesson' ? (
            <Badge variant="secondary">{t(`lessonKind.${lesson.kind}`)}</Badge>
          ) : null}
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Clock aria-hidden="true" className="size-3" />
            {t('common.minutes', { value: lesson.estimatedMinutes })}
          </span>
          <ContentStatusBadge status={lesson.contentStatus} />
        </span>
      </Link>
    </li>
  );
}

function CourseContent({ data }: { data: CourseDetail }) {
  const { t } = useTranslation();
  const format = useFormatters();
  const { course } = data;
  const first = data.modules[0]?.lessons[0];
  const { stats } = course;
  const progress = stats.lessonCount > 0 ? (stats.completedByUser / stats.lessonCount) * 100 : 0;
  usePageTitle(course.title);

  return (
    <>
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <Link to="/courses" className="hover:text-foreground hover:underline">
          {t('nav.items.courses')}
        </Link>
        <ChevronRight aria-hidden="true" className="size-4" />
        <Link to={`/learn/${course.trackSlug}`} className="hover:text-foreground hover:underline">
          {t(`tracks.${course.trackSlug}`)}
        </Link>
      </nav>

      <Card className="overflow-hidden py-0">
        <CardContent className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
          <CourseThumbnail seed={course.slug} track={course.trackSlug} icon={course.icon} />
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-1.5">
              <TrackBadge track={course.trackSlug} />
              <DifficultyBadge difficulty={course.difficulty} />
              <ContentStatusBadge status={course.contentStatus} />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{course.title}</h1>
              <p className="text-lg text-muted-foreground">{course.subtitle}</p>
            </div>
            <p className="text-muted-foreground">{course.description}</p>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <li>{t('courses.modules', { value: format.number(stats.moduleCount) })}</li>
              <li>{t('courses.lessons', { value: format.number(stats.lessonCount) })}</li>
              <li>
                {t('courses.duration', {
                  value: format.number(roundHours(stats.estimatedMinutes), { maximumFractionDigits: 1 }),
                })}
              </li>
              <li>
                {t('courses.lessonsWritten', {
                  done: format.number(stats.completeLessonCount),
                  total: format.number(stats.lessonCount),
                })}
              </li>
            </ul>
            <ProgressBar value={progress} label={course.title} className="h-1.5 max-w-sm" />
            {first ? (
              <div>
                <Button asChild>
                  <Link to={`/lessons/${first.slug}`}>
                    {t('courses.start')}
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <section aria-labelledby="outcomes-heading" className="space-y-3">
        <h2 id="outcomes-heading" className="text-lg font-semibold tracking-tight">
          {t('courses.outcomes')}
        </h2>
        <ul className="grid gap-3 md:grid-cols-3">
          {course.outcomes.map((outcome) => (
            <li key={outcome} className="flex gap-3 rounded-xl border bg-card p-4 text-sm shadow-card">
              <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />
              {outcome}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="curriculum-heading" className="space-y-3">
        <h2 id="curriculum-heading" className="text-lg font-semibold tracking-tight">
          {t('courses.curriculum')}
        </h2>
        <div className="space-y-3">
          {data.modules.map((module, index) => (
            <details
              key={module.slug}
              open={index === 0}
              className="group rounded-2xl border bg-card shadow-card"
            >
              <summary className="flex cursor-pointer list-none items-start gap-3 rounded-2xl p-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 sm:p-5 [&::-webkit-details-marker]:hidden">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-sm font-semibold text-accent-foreground">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{module.title}</span>
                  <span className="block text-sm text-muted-foreground">{module.description}</span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {t('courses.lessons', { value: module.lessons.length })}
                </span>
                <ChevronRight
                  aria-hidden="true"
                  className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90"
                />
              </summary>
              <ul className="border-t p-2">
                {module.lessons.map((lesson) => (
                  <LessonRow key={lesson.slug} lesson={lesson} />
                ))}
              </ul>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}

export function Component() {
  const { slug = '' } = useParams();
  const course = useCourse(slug);
  return (
    <PageContainer>
      <QueryBoundary
        query={course}
        skeleton={
          <div className="space-y-6" aria-hidden="true">
            <Skeleton className="h-64" />
            <Skeleton className="h-40" />
            <Skeleton className="h-64" />
          </div>
        }
      >
        {(data) => <CourseContent data={data} />}
      </QueryBoundary>
    </PageContainer>
  );
}
