import { z } from 'zod';
import {
  contentStatusSchema,
  difficultySchema,
  projectStatusSchema,
  slugSchema,
  timestampSchema,
} from './common';

const count = z.number().int().nonnegative();

export const projectSummarySchema = z.object({
  slug: slugSchema,
  title: z.string(),
  goal: z.string(),
  difficulty: difficultySchema,
  estimatedHours: z.number().int().positive(),
  contentStatus: contentStatusSchema,
  status: projectStatusSchema,
  milestonesTotal: count,
  milestonesDone: count,
});
export type ProjectSummary = z.infer<typeof projectSummarySchema>;

export const projectMilestoneSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  description: z.string(),
  completedAt: timestampSchema.nullable(),
});

export const projectPrerequisiteSchema = z.object({
  slug: slugSchema,
  title: z.string(),
  type: z.enum(['lesson', 'project']),
});

export const projectDetailSchema = z.object({
  project: projectSummarySchema.extend({
    summary: z.string(),
    prerequisites: z.array(projectPrerequisiteSchema),
    stack: z.array(z.string()),
    startedAt: timestampSchema.nullable(),
    completedAt: timestampSchema.nullable(),
  }),
  milestones: z.array(projectMilestoneSchema),
});
export type ProjectDetail = z.infer<typeof projectDetailSchema>;

export const listProjectsResponseSchema = z.object({ projects: z.array(projectSummarySchema) });

export const projectMilestoneParamsSchema = z.object({
  slug: slugSchema,
  milestoneId: z.coerce.number().int().positive(),
});
export const setMilestoneSchema = z.strictObject({ completed: z.boolean() });
