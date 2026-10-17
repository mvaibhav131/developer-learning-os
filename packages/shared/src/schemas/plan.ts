import { z } from 'zod';
import { ROADMAP_WEEK_COUNT } from '../constants';
import {
  contentStatusSchema,
  localDateSchema,
  planStateSchema,
  planTaskKindSchema,
  slugSchema,
  timestampSchema,
  trackSlugSchema,
} from './common';

const count = z.number().int().nonnegative();

export const planTaskSchema = z.object({
  id: z.number().int(),
  weekNumber: z.number().int(),
  dayOffset: z.number().int().min(0).max(6),
  scheduledDate: localDateSchema,
  trackSlug: trackSlugSchema,
  kind: planTaskKindSchema,
  title: z.string(),
  description: z.string().nullable(),
  plannedMinutes: z.number().int(),
  isOptional: z.boolean(),
  isCustom: z.boolean(),
  completedAt: timestampSchema.nullable(),
  projectSlug: slugSchema.nullable(),
  lesson: z
    .object({ slug: slugSchema, title: z.string(), contentStatus: contentStatusSchema })
    .nullable(),
});
export type PlanTask = z.infer<typeof planTaskSchema>;

export const planTotalsSchema = z.object({
  tasks: count,
  completed: count,
  coreTasks: count,
  coreCompleted: count,
  plannedMinutes: count,
  completedMinutes: count,
});
export type PlanTotals = z.infer<typeof planTotalsSchema>;

export const planWeekSummarySchema = z.object({
  weekNumber: z.number().int().min(1).max(ROADMAP_WEEK_COUNT),
  phaseKey: z.string(),
  phaseTitle: z.string(),
  title: z.string(),
  summary: z.string(),
  goals: z.array(z.string()),
  deliverable: z.string(),
  startDate: localDateSchema,
  endDate: localDateSchema,
  totals: planTotalsSchema,
});
export type PlanWeekSummary = z.infer<typeof planWeekSummarySchema>;

export const planPhaseSchema = z.object({
  key: z.string(),
  title: z.string(),
  weekStart: z.number().int(),
  weekEnd: z.number().int(),
  totals: planTotalsSchema,
});

export const planOverviewSchema = z.object({
  plan: z.object({
    id: z.number().int(),
    name: z.string(),
    startDate: localDateSchema,
    endDate: localDateSchema,
    weekCount: z.number().int(),
  }),
  today: localDateSchema,
  state: planStateSchema,
  currentWeek: z.number().int().nullable(),
  daysUntilStart: z.number().int().nullable(),
  totals: planTotalsSchema,
  phases: z.array(planPhaseSchema),
  weeks: z.array(planWeekSummarySchema),
});
export type PlanOverview = z.infer<typeof planOverviewSchema>;

export const planWeekParamsSchema = z.object({
  week: z.coerce.number().int().min(1).max(ROADMAP_WEEK_COUNT),
});

export const planDaySchema = z.object({
  dayOffset: z.number().int().min(0).max(6),
  date: localDateSchema,
  tasks: z.array(planTaskSchema),
});

export const planWeekDetailSchema = z.object({
  week: planWeekSummarySchema,
  days: z.array(planDaySchema),
});
export type PlanWeekDetail = z.infer<typeof planWeekDetailSchema>;

const taskTitle = z.string().trim().min(1).max(160);
const taskMinutes = z.number().int().min(5).max(480);

export const createPlanTaskSchema = z.strictObject({
  weekNumber: z.number().int().min(1).max(ROADMAP_WEEK_COUNT),
  dayOffset: z.number().int().min(0).max(6),
  trackSlug: trackSlugSchema,
  kind: planTaskKindSchema.default('practice'),
  title: taskTitle,
  description: z.string().trim().max(500).optional(),
  plannedMinutes: taskMinutes,
  isOptional: z.boolean().default(false),
});
export type CreatePlanTask = z.input<typeof createPlanTaskSchema>;

export const updatePlanTaskSchema = z
  .strictObject({
    title: taskTitle,
    description: z.string().trim().max(500).nullable(),
    trackSlug: trackSlugSchema,
    kind: planTaskKindSchema,
    plannedMinutes: taskMinutes,
    isOptional: z.boolean(),
    scheduledDate: localDateSchema,
    completed: z.boolean(),
  })
  .partial();
export type UpdatePlanTask = z.infer<typeof updatePlanTaskSchema>;

export const updatePlanSchema = z
  .strictObject({
    name: z.string().trim().min(1).max(80),
    startDate: localDateSchema,
  })
  .partial();

export const resetPlanSchema = z.strictObject({ confirm: z.literal(true) });
