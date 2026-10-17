import type { ProjectDetail, ProjectStatus, ProjectSummary } from '@dlos/shared';
import { and, count, eq, inArray } from 'drizzle-orm';
import { nowIso, type AppContext } from '../../core/context';
import {
  lessons,
  projectMilestones,
  projects,
  userProjectMilestones,
  userProjects,
} from '../../core/db/schema';
import { notFound } from '../../core/errors';

type ProjectRow = typeof projects.$inferSelect;

function userStatusFor(ctx: AppContext, projectId: number) {
  return ctx.db
    .select()
    .from(userProjects)
    .where(and(eq(userProjects.userId, ctx.userId), eq(userProjects.projectId, projectId)))
    .get();
}

function milestoneCounts(ctx: AppContext, projectId: number): { total: number; done: number } {
  const total =
    ctx.db
      .select({ n: count() })
      .from(projectMilestones)
      .where(eq(projectMilestones.projectId, projectId))
      .get()?.n ?? 0;
  const done =
    ctx.db
      .select({ n: count() })
      .from(userProjectMilestones)
      .innerJoin(projectMilestones, eq(projectMilestones.id, userProjectMilestones.milestoneId))
      .where(
        and(
          eq(userProjectMilestones.userId, ctx.userId),
          eq(projectMilestones.projectId, projectId),
        ),
      )
      .get()?.n ?? 0;
  return { total, done };
}

function summaryOf(ctx: AppContext, project: ProjectRow): ProjectSummary {
  const { total, done } = milestoneCounts(ctx, project.id);
  return {
    slug: project.slug,
    title: project.title,
    goal: project.goal,
    difficulty: project.difficulty,
    estimatedHours: project.estimatedHours,
    contentStatus: project.contentStatus,
    status: userStatusFor(ctx, project.id)?.status ?? 'not_started',
    milestonesTotal: total,
    milestonesDone: done,
  };
}

function requireProject(ctx: AppContext, slug: string): ProjectRow {
  const project = ctx.db.select().from(projects).where(eq(projects.slug, slug)).get();
  if (!project) throw notFound(`Project "${slug}"`);
  return project;
}

export function listProjects(ctx: AppContext): ProjectSummary[] {
  return ctx.db
    .select()
    .from(projects)
    .orderBy(projects.sortOrder)
    .all()
    .map((project) => summaryOf(ctx, project));
}

type Prerequisite = ProjectDetail['project']['prerequisites'][number];

function resolvePrerequisites(ctx: AppContext, slugs: string[]): Prerequisite[] {
  if (slugs.length === 0) return [];
  const lessonTitles = new Map(
    ctx.db
      .select({ slug: lessons.slug, title: lessons.title })
      .from(lessons)
      .where(inArray(lessons.slug, slugs))
      .all()
      .map((row) => [row.slug, row.title] as const),
  );
  const projectTitles = new Map(
    ctx.db
      .select({ slug: projects.slug, title: projects.title })
      .from(projects)
      .where(inArray(projects.slug, slugs))
      .all()
      .map((row) => [row.slug, row.title] as const),
  );
  return slugs.flatMap((slug): Prerequisite[] => {
    const lessonTitle = lessonTitles.get(slug);
    if (lessonTitle) return [{ slug, title: lessonTitle, type: 'lesson' }];
    const projectTitle = projectTitles.get(slug);
    return projectTitle ? [{ slug, title: projectTitle, type: 'project' }] : [];
  });
}

export function getProject(ctx: AppContext, slug: string): ProjectDetail {
  const project = requireProject(ctx, slug);
  const user = userStatusFor(ctx, project.id);
  const done = new Map(
    ctx.db
      .select({
        milestoneId: userProjectMilestones.milestoneId,
        completedAt: userProjectMilestones.completedAt,
      })
      .from(userProjectMilestones)
      .where(eq(userProjectMilestones.userId, ctx.userId))
      .all()
      .map((row) => [row.milestoneId, row.completedAt] as const),
  );
  return {
    project: {
      ...summaryOf(ctx, project),
      summary: project.summary,
      prerequisites: resolvePrerequisites(ctx, project.prerequisites),
      stack: project.stack,
      startedAt: user?.startedAt ?? null,
      completedAt: user?.completedAt ?? null,
    },
    milestones: ctx.db
      .select()
      .from(projectMilestones)
      .where(eq(projectMilestones.projectId, project.id))
      .orderBy(projectMilestones.sortOrder)
      .all()
      .map((milestone) => ({
        id: milestone.id,
        title: milestone.title,
        description: milestone.description,
        completedAt: done.get(milestone.id) ?? null,
      })),
  };
}

function saveUserStatus(
  ctx: AppContext,
  projectId: number,
  status: ProjectStatus,
  timestamps: { startedAt?: string | null; completedAt?: string | null },
): void {
  const now = nowIso(ctx);
  ctx.db
    .insert(userProjects)
    .values({
      userId: ctx.userId,
      projectId,
      status,
      startedAt: timestamps.startedAt ?? null,
      completedAt: timestamps.completedAt ?? null,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [userProjects.userId, userProjects.projectId],
      set: {
        status,
        ...(timestamps.startedAt !== undefined ? { startedAt: timestamps.startedAt } : {}),
        ...(timestamps.completedAt !== undefined ? { completedAt: timestamps.completedAt } : {}),
        updatedAt: now,
      },
    })
    .run();
}

export function startProject(ctx: AppContext, slug: string): ProjectDetail {
  const project = requireProject(ctx, slug);
  const existing = userStatusFor(ctx, project.id);
  if (!existing || existing.status === 'not_started') {
    saveUserStatus(ctx, project.id, 'in_progress', {
      startedAt: nowIso(ctx),
      completedAt: null,
    });
  }
  return getProject(ctx, slug);
}

export function setProjectMilestone(
  ctx: AppContext,
  slug: string,
  milestoneId: number,
  completed: boolean,
): ProjectDetail {
  const project = requireProject(ctx, slug);
  const milestone = ctx.db
    .select({ id: projectMilestones.id })
    .from(projectMilestones)
    .where(and(eq(projectMilestones.id, milestoneId), eq(projectMilestones.projectId, project.id)))
    .get();
  if (!milestone) throw notFound(`Milestone ${milestoneId}`);

  ctx.db.transaction(() => {
    if (completed) {
      ctx.db
        .insert(userProjectMilestones)
        .values({ userId: ctx.userId, milestoneId, completedAt: nowIso(ctx) })
        .onConflictDoNothing()
        .run();
    } else {
      ctx.db
        .delete(userProjectMilestones)
        .where(
          and(
            eq(userProjectMilestones.userId, ctx.userId),
            eq(userProjectMilestones.milestoneId, milestoneId),
          ),
        )
        .run();
    }

    const { total, done } = milestoneCounts(ctx, project.id);
    const existing = userStatusFor(ctx, project.id);
    const now = nowIso(ctx);
    if (total > 0 && done === total) {
      saveUserStatus(ctx, project.id, 'completed', {
        startedAt: existing?.startedAt ?? now,
        completedAt: now,
      });
    } else if (done > 0 || existing?.status === 'in_progress' || existing?.status === 'completed') {
      saveUserStatus(ctx, project.id, 'in_progress', {
        startedAt: existing?.startedAt ?? now,
        completedAt: null,
      });
    }
  });

  return getProject(ctx, slug);
}
