import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import {
  harnessCodecSchema,
  harnessOrderingSchema,
  localeSchema,
  problemDifficultySchema,
  slugSchema,
} from '@dlos/shared';
import { transform } from 'sucrase';
import { parse as parseYaml } from 'yaml';
import { z } from 'zod';

/** Finds `packages/learning-content/content` from the source tree, a bundled server or a custom path. */
export function contentRoot(): string {
  const override = process.env.DLOS_CONTENT_DIR;
  if (override) return path.resolve(override);

  let directory = import.meta.dirname;
  for (let depth = 0; depth < 8; depth += 1) {
    for (const candidate of [
      path.join(directory, 'content'),
      path.join(directory, 'packages', 'learning-content', 'content'),
    ]) {
      if (existsSync(path.join(candidate, 'videos.yaml'))) return candidate;
    }
    const parent = path.dirname(directory);
    if (parent === directory) break;
    directory = parent;
  }
  throw new Error('Could not find the learning content folder. Set DLOS_CONTENT_DIR to its path.');
}

const readText = (file: string): string => readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
const hashOf = (text: string): string => createHash('sha256').update(text).digest('hex').slice(0, 16);

// ---- video registry ---------------------------------------------------------------------------

const videoIdSchema = z.string().regex(/^[\w-]{11}$/, 'Expected an 11 character YouTube video id');

export const videoDefSchema = z.object({
  id: videoIdSchema,
  title: z.string().min(3),
  author: z.string().min(2),
  language: z.union([localeSchema, z.literal('multi')]).default('en'),
  topics: z.array(z.string()).default([]),
  /** Date of the last successful YouTube oEmbed check, or null when it was never verified. */
  verifiedAt: z.iso.date().nullable().default(null),
});
export type VideoDef = z.infer<typeof videoDefSchema>;

let videoCache: VideoDef[] | undefined;

export function loadVideoRegistry(): VideoDef[] {
  videoCache ??= z
    .object({ videos: z.array(videoDefSchema) })
    .parse(parseYaml(readText(path.join(contentRoot(), 'videos.yaml'))))
    .videos;
  return videoCache;
}

// ---- lessons ----------------------------------------------------------------------------------

export const lessonFrontmatterSchema = z.object({
  summary: z.string().min(20).max(300),
  tags: z.array(z.string()).default([]),
  videos: z.array(videoIdSchema).default([]),
  minutes: z.number().int().min(5).max(180).optional(),
});

export interface LessonFile {
  slug: string;
  summary: string;
  tags: string[];
  videoIds: string[];
  minutes: number | null;
  body: string;
  hash: string;
}

export function splitFrontmatter(source: string): { data: unknown; body: string } {
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(source);
  if (!match) throw new Error('Missing YAML frontmatter (--- ... ---) at the top of the file.');
  return { data: parseYaml(match[1] ?? ''), body: (match[2] ?? '').trim() };
}

let lessonCache: LessonFile[] | undefined;

export function loadLessonFiles(): LessonFile[] {
  if (lessonCache) return lessonCache;
  const directory = path.join(contentRoot(), 'lessons');
  lessonCache = readdirSync(directory)
    .filter((name) => name.endsWith('.md'))
    .sort()
    .map((name) => {
      const slug = name.slice(0, -'.md'.length);
      const source = readText(path.join(directory, name));
      try {
        const { data, body } = splitFrontmatter(source);
        const meta = lessonFrontmatterSchema.parse(data);
        return {
          slug: slugSchema.parse(slug),
          summary: meta.summary,
          tags: meta.tags,
          videoIds: meta.videos,
          minutes: meta.minutes ?? null,
          body,
          hash: hashOf(source),
        };
      } catch (error) {
        throw new Error(`lessons/${name}: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
      }
    });
  return lessonCache;
}

// ---- problems ---------------------------------------------------------------------------------

const identifier = /^[A-Za-z_$][\w$]*$/;

export const problemFileSchema = z.object({
  slug: slugSchema,
  title: z.string().min(3),
  difficulty: problemDifficultySchema,
  topics: z.array(z.string().min(2)).min(1),
  lesson: slugSchema.optional(),
  function: z.string().regex(identifier),
  args: z.array(harnessCodecSchema).optional(),
  returns: harnessCodecSchema.optional(),
  ordering: harnessOrderingSchema.optional(),
  inPlace: z.boolean().optional(),
  float: z.boolean().optional(),
  statement: z.string().min(40),
  constraints: z.string().optional(),
  examples: z
    .array(z.object({ input: z.string(), output: z.string(), explanation: z.string().optional() }))
    .min(1),
  starter: z.string().min(10),
  tests: z
    .array(z.object({ args: z.array(z.unknown()), expected: z.unknown(), hidden: z.boolean().optional() }))
    .min(5),
  hints: z.array(z.string().min(5)).min(1).max(5),
  solution: z.object({
    code: z.string().min(10),
    explanation: z.string().min(40),
    time: z.string(),
    space: z.string(),
  }),
  videos: z.array(videoIdSchema).default([]),
});
export type ProblemFile = z.infer<typeof problemFileSchema> & {
  starterJavaScript: string;
  solutionJavaScript: string;
};

/** Type annotations are erased; line numbers and layout stay the same. */
export const stripTypes = (code: string): string => transform(code, { transforms: ['typescript'] }).code;

let problemCache: ProblemFile[] | undefined;

export function loadProblemFiles(): ProblemFile[] {
  if (problemCache) return problemCache;
  const directory = path.join(contentRoot(), 'problems');
  problemCache = readdirSync(directory)
    .filter((name) => name.endsWith('.yaml'))
    .sort()
    .map((name) => {
      try {
        const parsed = problemFileSchema.parse(parseYaml(readText(path.join(directory, name))));
        if (`${parsed.slug}.yaml` !== name) throw new Error(`slug "${parsed.slug}" must match the file name`);
        return {
          ...parsed,
          starterJavaScript: stripTypes(parsed.starter),
          solutionJavaScript: stripTypes(parsed.solution.code),
        };
      } catch (error) {
        throw new Error(`problems/${name}: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
      }
    });
  return problemCache;
}

export function clearContentCache(): void {
  videoCache = undefined;
  lessonCache = undefined;
  problemCache = undefined;
  quizCache = undefined;
}

// ---- quizzes ----------------------------------------------------------------------------------

const quizQuestionFileSchema = z
  .object({
    kind: z.enum(['single', 'multiple', 'true-false']).default('single'),
    prompt: z.string().min(8),
    options: z.array(z.string().min(1)).min(2).max(6).optional(),
    answer: z.union([z.number().int().min(0), z.array(z.number().int().min(0)).min(1), z.boolean()]),
    explanation: z.string().min(10),
  })
  .superRefine((question, context) => {
    const fail = (message: string) => context.addIssue({ code: 'custom', message });
    if (question.kind === 'true-false') {
      if (typeof question.answer !== 'boolean') fail('true-false questions need answer: true or false');
      return;
    }
    const options = question.options;
    if (!options) return fail('options are required');
    const picks = Array.isArray(question.answer) ? question.answer : [question.answer];
    if (picks.some((pick) => typeof pick !== 'number' || pick >= options.length)) fail('answer points outside the options');
    if (question.kind === 'single' && (Array.isArray(question.answer) || typeof question.answer !== 'number')) {
      fail('single questions need one answer index');
    }
    if (question.kind === 'multiple' && (!Array.isArray(question.answer) || question.answer.length < 2)) {
      fail('multiple questions need a list of two or more answer indexes');
    }
  });

export const quizFileSchema = z.object({
  title: z.string().min(3).default('Check your understanding'),
  passPercent: z.number().int().min(50).max(100).default(70),
  questions: z.array(quizQuestionFileSchema).min(3).max(15),
});

export interface QuizQuestionDef {
  kind: 'single' | 'multiple' | 'true-false';
  prompt: string;
  options: Array<{ id: string; text: string }>;
  correctOptionIds: string[];
  explanation: string;
}

export interface QuizFile {
  /** Same as the lesson slug. */
  slug: string;
  title: string;
  passPercent: number;
  questions: QuizQuestionDef[];
}

const OPTION_IDS = ['a', 'b', 'c', 'd', 'e', 'f'];

function normaliseQuestion(question: z.infer<typeof quizQuestionFileSchema>): QuizQuestionDef {
  if (question.kind === 'true-false') {
    return {
      kind: 'true-false',
      prompt: question.prompt,
      options: [
        { id: 'true', text: 'True' },
        { id: 'false', text: 'False' },
      ],
      correctOptionIds: [question.answer === true ? 'true' : 'false'],
      explanation: question.explanation,
    };
  }
  const picks = Array.isArray(question.answer) ? question.answer : [question.answer];
  return {
    kind: question.kind,
    prompt: question.prompt,
    options: (question.options ?? []).map((text, index) => ({ id: OPTION_IDS[index] ?? String(index), text })),
    correctOptionIds: picks.map((pick) => OPTION_IDS[Number(pick)] ?? String(pick)),
    explanation: question.explanation,
  };
}

let quizCache: QuizFile[] | undefined;

export function loadQuizFiles(): QuizFile[] {
  if (quizCache) return quizCache;
  const directory = path.join(contentRoot(), 'quizzes');
  quizCache = !existsSync(directory)
    ? []
    : readdirSync(directory)
        .filter((name) => name.endsWith('.yaml'))
        .sort()
        .map((name) => {
          try {
            const parsed = quizFileSchema.parse(parseYaml(readText(path.join(directory, name))));
            return {
              slug: slugSchema.parse(name.slice(0, -'.yaml'.length)),
              title: parsed.title,
              passPercent: parsed.passPercent,
              questions: parsed.questions.map(normaliseQuestion),
            };
          } catch (error) {
            throw new Error(`quizzes/${name}: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
          }
        });
  return quizCache;
}
