import type { PlanTaskKind, TrackSlug } from '@dlos/shared';
import { curriculum } from '../curriculum';
import type { SlotDef } from '../types';
import { roadmapPhases } from './phases';
import { roadmapWeeks } from './weeks';

export { roadmapPhases, roadmapWeeks };

export interface PlannedTask {
  weekNumber: number;
  /** 0-4 are core study days, 5-6 optional sessions. */
  dayOffset: number;
  trackSlug: TrackSlug;
  kind: PlanTaskKind;
  title: string;
  plannedMinutes: number;
  lessonSlug: string | null;
  projectSlug: string | null;
  isOptional: boolean;
  sortOrder: number;
}

export interface LessonIndexEntry {
  slug: string;
  title: string;
  trackSlug: TrackSlug;
  courseSlug: string;
  kind: PlanTaskKind;
}

const LESSON_KIND_TO_TASK_KIND = {
  lesson: 'lesson',
  'case-study': 'lesson',
  lab: 'practice',
  revision: 'revision',
  assessment: 'assessment',
} as const satisfies Record<string, PlanTaskKind>;

export function indexLessons(): Map<string, LessonIndexEntry> {
  const index = new Map<string, LessonIndexEntry>();
  for (const track of curriculum) {
    for (const course of track.courses) {
      for (const module of course.modules) {
        for (const lesson of module.lessons) {
          index.set(lesson.slug, {
            slug: lesson.slug,
            title: lesson.title,
            trackSlug: track.slug,
            courseSlug: course.slug,
            kind: LESSON_KIND_TO_TASK_KIND[lesson.kind],
          });
        }
      }
    }
  }
  return index;
}

const CORE_MINUTES = { ai: 60, dsa: 30, 'system-design': 30 } as const;

/** Turns the compact week definitions into flat, schedulable tasks. */
export function expandRoadmap(): PlannedTask[] {
  const lessonIndex = indexLessons();
  const tasks: PlannedTask[] = [];

  const resolve = (
    slot: SlotDef,
    defaults: { trackSlug: TrackSlug; minutes: number },
  ): Omit<PlannedTask, 'weekNumber' | 'dayOffset' | 'isOptional' | 'sortOrder' | 'projectSlug'> => {
    if (typeof slot === 'string') {
      const lesson = lessonIndex.get(slot);
      return {
        trackSlug: defaults.trackSlug,
        kind: lesson?.kind ?? 'lesson',
        title: lesson?.title ?? slot,
        plannedMinutes: defaults.minutes,
        lessonSlug: lesson ? slot : null,
      };
    }
    return {
      trackSlug: defaults.trackSlug,
      kind: slot.kind,
      title: slot.title,
      plannedMinutes: slot.minutes ?? defaults.minutes,
      lessonSlug: slot.lesson ?? null,
    };
  };

  for (const week of roadmapWeeks) {
    const core: Array<[TrackSlug, readonly SlotDef[]]> = [
      ['ai', week.ai],
      ['dsa', week.dsa],
      ['system-design', week.systemDesign],
    ];
    core.forEach(([trackSlug, slots], trackIndex) => {
      slots.forEach((slot, dayOffset) => {
        const minutes = CORE_MINUTES[trackSlug as keyof typeof CORE_MINUTES];
        tasks.push({
          ...resolve(slot, { trackSlug, minutes }),
          weekNumber: week.week,
          dayOffset,
          projectSlug: null,
          isOptional: false,
          sortOrder: trackIndex + 1,
        });
      });
    });

    tasks.push({
      weekNumber: week.week,
      dayOffset: 5,
      trackSlug: 'ai',
      kind: week.lab.project ? 'project' : (week.lab.kind ?? 'practice'),
      title: week.lab.title,
      plannedMinutes: week.lab.minutes,
      lessonSlug: null,
      projectSlug: week.lab.project ?? null,
      isOptional: true,
      sortOrder: 1,
    });
    tasks.push({
      weekNumber: week.week,
      dayOffset: 5,
      trackSlug: 'dsa',
      kind: 'revision',
      title: 'Weekly review: flashcards, notes and due problems',
      plannedMinutes: 30,
      lessonSlug: null,
      projectSlug: null,
      isOptional: true,
      sortOrder: 2,
    });

    week.fullStack.forEach((slot, index) => {
      tasks.push({
        ...resolve(slot, {
          trackSlug: 'full-stack',
          minutes: week.fullStack.length > 1 ? 45 : 60,
        }),
        weekNumber: week.week,
        dayOffset: 6,
        projectSlug: null,
        isOptional: true,
        sortOrder: index + 1,
      });
    });
    tasks.push({
      ...resolve(week.interview, { trackSlug: 'interview', minutes: 45 }),
      weekNumber: week.week,
      dayOffset: 6,
      projectSlug: null,
      isOptional: true,
      sortOrder: 9,
    });
  }

  return tasks;
}
