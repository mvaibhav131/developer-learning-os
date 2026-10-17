import type { CourseSummary } from '@dlos/shared';
import { ProgressBar, cn } from '@dlos/ui';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { roundHours, useFormatters } from '../lib/format';
import { ContentStatusBadge, DifficultyBadge, TrackBadge } from './badges';
import { CourseThumbnail } from './course-thumbnail';

export function CourseCard({ course, className }: { course: CourseSummary; className?: string }) {
  const { t } = useTranslation();
  const format = useFormatters();
  const { stats } = course;
  const progress = stats.lessonCount > 0 ? (stats.completedByUser / stats.lessonCount) * 100 : 0;

  return (
    <Link
      to={`/courses/${course.slug}`}
      className={cn(
        'group flex h-full flex-col gap-3 rounded-2xl border bg-card p-3 shadow-card outline-none transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-pop focus-visible:ring-[3px] focus-visible:ring-ring/40',
        className,
      )}
    >
      <CourseThumbnail seed={course.slug} track={course.trackSlug} icon={course.icon} />
      <div className="flex flex-wrap gap-1.5 px-1">
        <TrackBadge track={course.trackSlug} />
        <DifficultyBadge difficulty={course.difficulty} />
      </div>
      <div className="space-y-1 px-1">
        <h3 className="leading-snug font-semibold tracking-tight group-hover:text-brand">
          {course.title}
        </h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{course.subtitle}</p>
      </div>
      <div className="mt-auto space-y-2 px-1 pb-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>{t('courses.modules', { value: format.number(stats.moduleCount) })}</span>
          <span>{t('courses.lessons', { value: format.number(stats.lessonCount) })}</span>
          <span>
            {t('courses.duration', {
              value: format.number(roundHours(stats.estimatedMinutes), { maximumFractionDigits: 1 }),
            })}
          </span>
        </div>
        <ProgressBar value={progress} label={course.title} className="h-1.5" />
        <div className="flex items-center justify-between gap-2">
          <ContentStatusBadge status={course.contentStatus} />
          <span className="text-xs text-muted-foreground">
            {t('learn.completed', { value: format.number(stats.completedByUser) })}
          </span>
        </div>
      </div>
    </Link>
  );
}
