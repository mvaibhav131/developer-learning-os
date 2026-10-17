import { existsSync } from 'node:fs';
import path from 'node:path';
import { isValidTimeZone } from '@dlos/shared';
import { z } from 'zod';

export function findRepoRoot(start: string = process.cwd()): string {
  let dir = path.resolve(start);
  for (;;) {
    if (existsSync(path.join(dir, 'pnpm-workspace.yaml'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return path.resolve(start);
    dir = parent;
  }
}

/** Loads `<repo>/.env` without overriding variables that are already set. */
export function loadDotEnv(repoRoot: string = findRepoRoot()): void {
  const file = path.join(repoRoot, '.env');
  if (existsSync(file)) process.loadEnvFile(file);
}

const flag = (fallback: boolean) =>
  z
    .string()
    .optional()
    .transform((value) =>
      value === undefined ? fallback : ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase()),
    );

const list = (fallback: string) =>
  z
    .string()
    .default(fallback)
    .transform((value) =>
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    );

/** Docker and hosting platforms often pass unset variables as empty strings. */
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (typeof value === 'string' && value.trim() === '' ? undefined : value), schema.optional());

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    API_HOST: z.string().min(1).default('127.0.0.1'),
    API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    DATABASE_PATH: z.string().min(1).default('data/dlos.sqlite'),
    AUTO_MIGRATE: flag(true),
    AUTO_SEED: flag(true),
    ALLOWED_ORIGINS: list(
      'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173',
    ),
    ALLOWED_HOSTS: list('localhost,127.0.0.1,[::1]'),
    RATE_LIMIT_PER_MINUTE: z.coerce.number().int().min(10).max(100_000).default(600),
    OWNER_DISPLAY_NAME: z.string().trim().min(1).max(60).default('Learner'),
    APP_TIMEZONE: z.string().optional(),
    /** Where the app is reachable, for example https://learn.example.com. Adds its origin and host to the allow-lists. */
    PUBLIC_URL: optional(z.url()),
    /** Set automatically by Render. Used when PUBLIC_URL is not set. */
    RENDER_EXTERNAL_URL: optional(z.url()),
    /** How many reverse proxies sit in front of the API (0 when it is reached directly). */
    TRUST_PROXY: z.coerce.number().int().min(0).max(10).default(0),
    /** Folder with the built web app (apps/web/dist). When set, the API serves the web app as well. */
    WEB_DIST_DIR: optional(z.string().min(1)),
    BASIC_AUTH_USER: optional(z.string().max(64).regex(/^[^:]+$/, 'must not contain a colon')),
    BASIC_AUTH_PASSWORD: optional(z.string().min(12, 'must have at least 12 characters').max(128)),
  })
  .refine((values) => Boolean(values.BASIC_AUTH_USER) === Boolean(values.BASIC_AUTH_PASSWORD), {
    path: ['BASIC_AUTH_USER'],
    message: 'set both BASIC_AUTH_USER and BASIC_AUTH_PASSWORD, or neither',
  });

export interface AppConfig {
  env: 'development' | 'test' | 'production';
  host: string;
  port: number;
  logLevel: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';
  databasePath: string;
  autoMigrate: boolean;
  autoSeed: boolean;
  allowedOrigins: string[];
  allowedHosts: string[];
  rateLimitPerMinute: number;
  ownerDisplayName: string;
  timezone: string;
  repoRoot: string;
  trustProxy: number;
  /** Absolute path of the built web app, or null when only the API runs. */
  webDistDir: string | null;
  /** HTTP Basic credentials that protect everything except the health check, or null for none. */
  basicAuth: { user: string; password: string } | null;
}

export function loadConfig(
  env: NodeJS.ProcessEnv = process.env,
  repoRoot: string = findRepoRoot(),
): AppConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => ` - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${details}`);
  }
  const values = parsed.data;
  const machineZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const timezone = values.APP_TIMEZONE ?? machineZone;
  if (!isValidTimeZone(timezone)) {
    throw new Error(`Invalid environment configuration:\n - APP_TIMEZONE: unknown IANA zone "${timezone}"`);
  }

  const allowedOrigins = [...values.ALLOWED_ORIGINS];
  const allowedHosts = [...values.ALLOWED_HOSTS];
  const publicUrl = values.PUBLIC_URL ?? values.RENDER_EXTERNAL_URL;
  if (publicUrl) {
    const url = new URL(publicUrl);
    if (!allowedOrigins.includes(url.origin)) allowedOrigins.push(url.origin);
    if (!allowedHosts.includes(url.hostname)) allowedHosts.push(url.hostname);
  }

  let webDistDir: string | null = null;
  if (values.WEB_DIST_DIR) {
    webDistDir = path.resolve(repoRoot, values.WEB_DIST_DIR);
    if (!existsSync(path.join(webDistDir, 'index.html'))) {
      throw new Error(
        `Invalid environment configuration:\n - WEB_DIST_DIR: there is no index.html in ${webDistDir}. Build the web app first (pnpm --filter @dlos/web build).`,
      );
    }
  }

  return {
    env: values.NODE_ENV,
    host: values.API_HOST,
    port: values.API_PORT,
    logLevel: values.LOG_LEVEL,
    databasePath:
      values.DATABASE_PATH === ':memory:' ? ':memory:' : path.resolve(repoRoot, values.DATABASE_PATH),
    autoMigrate: values.AUTO_MIGRATE,
    autoSeed: values.AUTO_SEED,
    allowedOrigins,
    allowedHosts,
    rateLimitPerMinute: values.RATE_LIMIT_PER_MINUTE,
    ownerDisplayName: values.OWNER_DISPLAY_NAME,
    timezone,
    repoRoot,
    trustProxy: values.TRUST_PROXY,
    webDistDir,
    basicAuth:
      values.BASIC_AUTH_USER && values.BASIC_AUTH_PASSWORD
        ? { user: values.BASIC_AUTH_USER, password: values.BASIC_AUTH_PASSWORD }
        : null,
  };
}
