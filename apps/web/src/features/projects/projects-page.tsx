import type { ProjectStatus, ProjectSummary } from '@dlos/shared';
import { Badge, ProgressBar, Skeleton } from '@dlos/ui';
import { Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { ContentStatusBadge, DifficultyBadge } from '../../components/badges';
import { PageContainer, PageHeader, QueryBoundary } from '../../components/page';
import { useFormatters } from '../../lib/format';
import { useProjects } from '../../lib/queries';

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const { t } = useTranslation();
  const variant = status === 'completed' ? 'success' : status === 'in_progress' ? 'info' : 'outline';
  const label =
    status === 'completed'
      ? t('projects.completed')
      : status === 'in_progress'
        ? t('projects.inProgress')
        : t('projects.notStarted');
  return <Badge variant={variant}>{label}</Badge>;
}

function ProjectCard({ project }: { project: ProjectSummary }) {
  const { t } = useTranslation();
  const format = useFormatters();
  const percent = project.milestonesTotal > 0 ? (project.milestonesDone / project.milestonesTotal) * 100 : 0;
  return (
    <Link
      to={`/projects/${project.slug}`}
      className="group flex h-full flex-col gap-3 rounded-2xl border bg-card p-5 shadow-card outline-none transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-pop focus-visible:ring-[3px] focus-visible:ring-ring/40"
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <ProjectStatusBadge status={project.status} />
        <DifficultyBadge difficulty={project.difficulty} />
      </div>
      <h2 className="leading-snug font-semibold tracking-tight group-hover:text-brand">{project.title}</h2>
      <p className="text-sm text-muted-foreground">{project.goal}</p>
      <div className="mt-auto space-y-2">
        <ProgressBar value={percent} label={project.title} className="h-1.5" />
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="tabular-nums">
            {t('projects.milestonesDone', { done: project.milestonesDone, total: project.milestonesTotal })}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock aria-hidden="true" className="size-3" />
            {t('projects.hours', { value: format.number(project.estimatedHours) })}
          </span>
        </div>
        <ContentStatusBadge status={project.contentStatus} />
      </div>
    </Link>
  );
}

export function Component() {
  const { t } = useTranslation();
  const projects = useProjects();
  return (
    <PageContainer>
      <PageHeader title={t('projects.title')} description={t('projects.subtitle')} />
      <QueryBoundary
        query={projects}
        skeleton={
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-60" />
            ))}
          </div>
        }
      >
        {(data) => (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 lg:gap-6">
            {data.projects.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
        )}
      </QueryBoundary>
      <p className="text-sm text-muted-foreground">{t('projects.guidePlanned')}</p>
    </PageContainer>
  );
}
