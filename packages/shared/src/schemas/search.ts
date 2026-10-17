import { z } from 'zod';
import { searchEntityTypeSchema, trackSlugSchema } from './common';

export const searchQuerySchema = z.object({
  q: z.string().trim().min(2).max(80),
  limit: z.coerce.number().int().min(1).max(30).default(12),
});

export const searchResultSchema = z.object({
  type: searchEntityTypeSchema,
  slug: z.string(),
  title: z.string(),
  subtitle: z.string().nullable(),
  trackSlug: trackSlugSchema.nullable(),
  score: z.number(),
});
export type SearchResult = z.infer<typeof searchResultSchema>;

export const searchResponseSchema = z.object({
  query: z.string(),
  total: z.number().int().nonnegative(),
  results: z.array(searchResultSchema),
});
export type SearchResponse = z.infer<typeof searchResponseSchema>;
