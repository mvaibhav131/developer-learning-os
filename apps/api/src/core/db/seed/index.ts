import {
  DEFAULT_DAILY_GOALS,
  DEFAULT_STREAK_MIN_MINUTES,
  DEFAULT_LOCALE,
  formatLocalDate,
} from '@dlos/shared';
import { curriculum, projects } from '@dlos/learning-content';
import { eq } from 'drizzle-orm';
import type { AppConfig } from '../../../config/env';
import type { Clock } from '../../clock';
import type { Db } from '../client';
import {
  aiSettings,
  courses,
  learningTracks,
  lessons,
  modules,
  projectMilestones,
  projects as projectsTable,
  userPreferences,
  users,
} from '../schema';
import { createPlanFromTemplate, getActivePlanRow } from '../../../features/plan/plan.template';
import { seedAuthoredContent } from './authored';

type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

function required<T>(value: T | undefined, what: string): T {
  if (value === undefined) throw new Error(`Expected ${what} to be returned by the database`);
  return value;
}

/** Idempotent upsert of the curriculum and AI labs. User-owned tables are never touched. */
export function seedContent(
  db: Db,
  now: string,
): { lessons: number; projects: number; lessonBodies: number; problems: number } {
  let lessonCount = 0;
  let authored = { lessonBodies: 0, problems: 0 };

  db.transaction((tx: Tx) => {
    curriculum.forEach((track, trackIndex) => {
      const trackRow = required(
        tx
          .insert(learningTracks)
          .values({
            slug: track.slug,
            title: track.title,
            shortTitle: track.shortTitle,
            description: track.description,
            icon: track.icon,
            sortOrder: trackIndex + 1,
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: learningTracks.slug,
            set: {
              title: track.title,
              shortTitle: track.shortTitle,
              description: track.description,
              icon: track.icon,
              sortOrder: trackIndex + 1,
              updatedAt: now,
            },
          })
          .returning({ id: learningTracks.id })
          .get(),
        'track row',
      );

      track.courses.forEach((course, courseIndex) => {
        const courseRow = required(
          tx
            .insert(courses)
            .values({
              trackId: trackRow.id,
              slug: course.slug,
              title: course.title,
              subtitle: course.subtitle,
              description: course.description,
              difficulty: course.difficulty,
              icon: course.icon,
              tags: course.tags,
              outcomes: course.outcomes,
              sortOrder: courseIndex + 1,
              createdAt: now,
              updatedAt: now,
            })
            .onConflictDoUpdate({
              target: courses.slug,
              set: {
                trackId: trackRow.id,
                title: course.title,
                subtitle: course.subtitle,
                description: course.description,
                difficulty: course.difficulty,
                icon: course.icon,
                tags: course.tags,
                outcomes: course.outcomes,
                sortOrder: courseIndex + 1,
                updatedAt: now,
              },
            })
            .returning({ id: courses.id })
            .get(),
          'course row',
        );

        let lessonOrder = 0;
        course.modules.forEach((module, moduleIndex) => {
          const moduleRow = required(
            tx
              .insert(modules)
              .values({
                courseId: courseRow.id,
                slug: module.slug,
                title: module.title,
                description: module.description,
                sortOrder: moduleIndex + 1,
              })
              .onConflictDoUpdate({
                target: [modules.courseId, modules.slug],
                set: {
                  title: module.title,
                  description: module.description,
                  sortOrder: moduleIndex + 1,
                },
              })
              .returning({ id: modules.id })
              .get(),
            'module row',
          );

          for (const lesson of module.lessons) {
            lessonOrder += 1;
            lessonCount += 1;
            tx.insert(lessons)
              .values({
                moduleId: moduleRow.id,
                courseId: courseRow.id,
                slug: lesson.slug,
                title: lesson.title,
                summary: lesson.summary ?? null,
                difficulty: lesson.difficulty,
                kind: lesson.kind,
                estimatedMinutes: lesson.minutes,
                contentStatus: lesson.status,
                tags: lesson.tags ?? [],
                sortOrder: lessonOrder,
                createdAt: now,
                updatedAt: now,
              })
              .onConflictDoUpdate({
                target: lessons.slug,
                set: {
                  moduleId: moduleRow.id,
                  courseId: courseRow.id,
                  title: lesson.title,
                  summary: lesson.summary ?? null,
                  difficulty: lesson.difficulty,
                  kind: lesson.kind,
                  estimatedMinutes: lesson.minutes,
                  contentStatus: lesson.status,
                  tags: lesson.tags ?? [],
                  sortOrder: lessonOrder,
                  updatedAt: now,
                },
              })
              .run();
          }
        });
      });
    });

    projects.forEach((project, projectIndex) => {
      const projectRow = required(
        tx
          .insert(projectsTable)
          .values({
            slug: project.slug,
            title: project.title,
            goal: project.goal,
            summary: project.summary,
            difficulty: project.difficulty,
            estimatedHours: project.estimatedHours,
            prerequisites: project.prerequisites,
            stack: project.stack,
            sortOrder: projectIndex + 1,
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: projectsTable.slug,
            set: {
              title: project.title,
              goal: project.goal,
              summary: project.summary,
              difficulty: project.difficulty,
              estimatedHours: project.estimatedHours,
              prerequisites: project.prerequisites,
              stack: project.stack,
              sortOrder: projectIndex + 1,
              updatedAt: now,
            },
          })
          .returning({ id: projectsTable.id })
          .get(),
        'project row',
      );
      project.milestones.forEach(([title, description], milestoneIndex) => {
        tx.insert(projectMilestones)
          .values({
            projectId: projectRow.id,
            title,
            description,
            sortOrder: milestoneIndex + 1,
          })
          .onConflictDoUpdate({
            target: [projectMilestones.projectId, projectMilestones.sortOrder],
            set: { title, description },
          })
          .run();
      });
    });

    authored = seedAuthoredContent(tx, now);
  });

  return { lessons: lessonCount, projects: projects.length, ...authored };
}

export function ensureOwnerProfile(
  db: Db,
  options: { displayName: string; timezone: string; now: string },
): number {
  const existing = db.select({ id: users.id }).from(users).where(eq(users.handle, 'owner')).get();
  if (existing) return existing.id;

  return db.transaction((tx: Tx) => {
    const user = required(
      tx
        .insert(users)
        .values({ handle: 'owner', displayName: options.displayName, createdAt: options.now })
        .returning({ id: users.id })
        .get(),
      'user row',
    );
    tx.insert(userPreferences)
      .values({
        userId: user.id,
        locale: DEFAULT_LOCALE,
        theme: 'system',
        timezone: options.timezone,
        weekStartsOn: 1,
        dailyGoals: { ...DEFAULT_DAILY_GOALS },
        streakMinMinutes: DEFAULT_STREAK_MIN_MINUTES,
        updatedAt: options.now,
      })
      .run();
    tx.insert(aiSettings).values({ userId: user.id, updatedAt: options.now }).run();
    return user.id;
  });
}

export interface SeedResult {
  userId: number;
  lessons: number;
  planCreated: boolean;
}

/** Brings an empty or existing database to a usable state. Safe to run on every start. */
export function seedAll(db: Db, options: { config: Pick<AppConfig, 'ownerDisplayName' | 'timezone'>; clock: Clock }): SeedResult {
  const now = options.clock.now().toISOString();
  const content = seedContent(db, now);
  const userId = ensureOwnerProfile(db, {
    displayName: options.config.ownerDisplayName,
    timezone: options.config.timezone,
    now,
  });

  let planCreated = false;
  if (!getActivePlanRow(db, userId)) {
    createPlanFromTemplate(db, {
      userId,
      startDate: formatLocalDate(options.clock.now(), options.config.timezone),
      now,
    });
    planCreated = true;
  }
  return { userId, lessons: content.lessons, planCreated };
}
