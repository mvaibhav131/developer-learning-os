import { z } from 'zod';
import {
  achievementKeySchema,
  activityTypeSchema,
  localDateSchema,
  monthSchema,
  planStateSchema,
  slugSchema,
  timestampSchema,
  trackMinutesSchema,
  trackSlugSchema,
} from './common';
import { lessonRefSchema } from './curriculum';
import { planTaskSchema } from './plan';

const count = z.number().int().nonnegative();
const percent = z.number().int().min(0).max(100);

export const dashboardSchema = z.object({
  generatedAt: timestampSchema,
  today: localDateSchema,
  timezone: z.string(),
  profile: z.object({ displayName: z.string() }),
  plan: z.object({
    state: planStateSchema,
    startDate: localDateSchema.nullable(),
    endDate: localDateSchema.nullable(),
    daysUntilStart: z.number().int().nullable(),
    currentWeek: z.number().int().nullable(),
    totalWeeks: count,
    week: z
      .object({
        weekNumber: z.number().int(),
        title: z.string(),
        phaseKey: z.string(),
        phaseTitle: z.string(),
        summary: z.string(),
        goals: z.array(z.string()),
        deliverable: z.string(),
        coreTasks: count,
        coreCompleted: count,
        optionalTasks: count,
        optionalCompleted: count,
      })
      .nullable(),
    overall: z.object({ coreTasks: count, coreCompleted: count, percent }),
  }),
  daily: z.object({
    targetMinutes: count,
    studiedMinutes: count,
    percent,
    byTrack: z.array(
      z.object({ trackSlug: trackSlugSchema, targetMinutes: count, studiedMinutes: count }),
    ),
  }),
  todayTasks: z.array(planTaskSchema),
  nextUp: planTaskSchema.nullable(),
  weekly: z.object({
    weekStart: localDateSchema,
    totalMinutes: count,
    targetMinutes: count,
    days: z.array(z.object({ date: localDateSchema, minutes: count, byTrack: trackMinutesSchema })),
  }),
  streak: z.object({
    current: count,
    longest: count,
    lastActiveDate: localDateSchema.nullable(),
    todayCounts: z.boolean(),
    minMinutes: count,
  }),
  lessons: z.object({
    completed: count,
    inProgress: count,
    catalogTotal: count,
    authoredTotal: count,
  }),
  continueLearning: z.array(
    z.object({
      lesson: lessonRefSchema.extend({
        trackSlug: trackSlugSchema,
        courseSlug: slugSchema,
        courseTitle: z.string(),
      }),
      progressPercent: percent,
      lastAccessedAt: timestampSchema,
    }),
  ),
  /** The one lesson to open next: resume, the next one in the course, or the first ready lesson. */
  continueLesson: z
    .object({
      slug: slugSchema,
      title: z.string(),
      trackSlug: trackSlugSchema,
      courseSlug: slugSchema,
      courseTitle: z.string(),
      minutes: z.number().int().positive(),
      reason: z.enum(['resume', 'next', 'start']),
      hasVideo: z.boolean(),
    })
    .nullable(),
  practice: z.object({ total: count, solved: count, attempted: count }),
  reviews: z.object({
    dueToday: count,
    upcoming: z.array(z.object({ date: localDateSchema, count })),
  }),
  focusAreas: z.array(
    z.object({ trackSlug: trackSlugSchema, reason: z.enum(['overdue_tasks']), count }),
  ),
  upcomingAssignments: z.array(planTaskSchema),
  projects: z.object({
    total: count,
    started: count,
    completed: count,
    milestonesDone: count,
    milestonesTotal: count,
    active: z.array(
      z.object({
        slug: slugSchema,
        title: z.string(),
        milestonesDone: count,
        milestonesTotal: count,
      }),
    ),
  }),
  readiness: z.object({
    percent,
    signals: z.array(
      z.object({
        key: z.enum(['plan_progress', 'lessons', 'practice', 'interviews']),
        percent: percent.nullable(),
        weight: z.number(),
      }),
    ),
  }),
  recentActivity: z.array(
    z.object({
      id: z.number().int(),
      type: activityTypeSchema,
      occurredAt: timestampSchema,
      title: z.string().nullable(),
      trackSlug: trackSlugSchema.nullable(),
      minutes: count.nullable(),
    }),
  ),
  achievements: z.array(
    z.object({
      key: achievementKeySchema,
      unlocked: z.boolean(),
      current: z.number(),
      target: z.number(),
    }),
  ),
});
export type Dashboard = z.infer<typeof dashboardSchema>;

export const calendarQuerySchema = z.object({ month: monthSchema.optional() });

export const calendarDaySchema = z.object({
  date: localDateSchema,
  minutes: count,
  sessions: count,
  tasksScheduled: count,
  tasksCompleted: count,
  goalMet: z.boolean(),
});

export const calendarMonthSchema = z.object({
  month: monthSchema,
  today: localDateSchema,
  weekStartsOn: z.union([z.literal(0), z.literal(1)]),
  days: z.array(calendarDaySchema),
  totals: z.object({ minutes: count, activeDays: count }),
});
export type CalendarMonth = z.infer<typeof calendarMonthSchema>;
