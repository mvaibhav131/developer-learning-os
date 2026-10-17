import { expandRoadmap, roadmapPhases, roadmapWeeks } from '@dlos/learning-content';
import { and, eq } from 'drizzle-orm';
import type { Db } from '../../core/db/client';
import { lessons, studyPlans, studyPlanTasks, studyPlanWeeks } from '../../core/db/schema';

export const PLAN_TEMPLATE_KEY = 'default-24-week';
const INSERT_CHUNK = 100;

export type PlanRow = typeof studyPlans.$inferSelect;

export function getActivePlanRow(db: Db, userId: number): PlanRow | undefined {
  return db
    .select()
    .from(studyPlans)
    .where(and(eq(studyPlans.userId, userId), eq(studyPlans.isActive, true)))
    .get();
}

function chunk<T>(items: readonly T[], size: number): T[][] {
  const groups: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    groups.push(items.slice(index, index + size));
  }
  return groups;
}

/** Copies the roadmap template into user-owned rows so edits never touch shared content. */
export function createPlanFromTemplate(
  db: Db,
  options: { userId: number; startDate: string; now: string; name?: string },
): number {
  return db.transaction((tx) => {
    tx.update(studyPlans)
      .set({ isActive: false })
      .where(eq(studyPlans.userId, options.userId))
      .run();

    const plan = tx
      .insert(studyPlans)
      .values({
        userId: options.userId,
        name: options.name ?? '24-week AI, DSA and system design plan',
        templateKey: PLAN_TEMPLATE_KEY,
        startDate: options.startDate,
        isActive: true,
        createdAt: options.now,
        updatedAt: options.now,
      })
      .returning({ id: studyPlans.id })
      .get();
    if (!plan) throw new Error('Failed to create the study plan');

    tx.insert(studyPlanWeeks)
      .values(
        roadmapWeeks.map((week) => {
          const phase = roadmapPhases.find((candidate) => candidate.key === week.phase);
          return {
            planId: plan.id,
            weekNumber: week.week,
            phaseKey: week.phase,
            phaseTitle: phase?.title ?? week.phase,
            title: week.title,
            summary: week.summary,
            goals: week.goals,
            deliverable: week.deliverable,
          };
        }),
      )
      .run();

    const lessonIds = new Map(
      tx
        .select({ id: lessons.id, slug: lessons.slug })
        .from(lessons)
        .all()
        .map((row) => [row.slug, row.id] as const),
    );

    const rows = expandRoadmap().map((task) => ({
      planId: plan.id,
      weekNumber: task.weekNumber,
      dayOffset: task.dayOffset,
      trackSlug: task.trackSlug,
      kind: task.kind,
      title: task.title,
      description: null,
      plannedMinutes: task.plannedMinutes,
      lessonId: task.lessonSlug ? (lessonIds.get(task.lessonSlug) ?? null) : null,
      projectSlug: task.projectSlug,
      isOptional: task.isOptional,
      isCustom: false,
      sortOrder: task.sortOrder,
      createdAt: options.now,
      updatedAt: options.now,
    }));
    for (const group of chunk(rows, INSERT_CHUNK)) {
      tx.insert(studyPlanTasks).values(group).run();
    }
    return plan.id;
  });
}
