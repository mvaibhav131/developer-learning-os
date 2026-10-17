import pino from 'pino';
import supertest from 'supertest';
import { createApp } from '../app';
import { loadConfig } from '../config/env';
import { createFixedClock } from '../core/clock';
import type { AppContext } from '../core/context';
import { openDatabase } from '../core/db/client';
import { runMigrations } from '../core/db/migrate';
import { seedAll } from '../core/db/seed';

/** Monday 19 Oct 2026, 10:30 in Asia/Kolkata: day 1 of a plan that starts "today". */
export const DEFAULT_NOW = '2026-10-19T05:00:00.000Z';
export const DEFAULT_TODAY = '2026-10-19';

export function createTestApp(options: { now?: string; timezone?: string; env?: Record<string, string> } = {}) {
  const clock = createFixedClock(options.now ?? DEFAULT_NOW);
  const config = loadConfig(
    {
      NODE_ENV: 'test',
      LOG_LEVEL: 'silent',
      DATABASE_PATH: ':memory:',
      APP_TIMEZONE: options.timezone ?? 'Asia/Kolkata',
      RATE_LIMIT_PER_MINUTE: '100000',
      ...options.env,
    },
    process.cwd(),
  );
  const handle = openDatabase(':memory:');
  runMigrations(handle.db);
  const { userId } = seedAll(handle.db, { config, clock });
  const ctx: AppContext = {
    db: handle.db,
    clock,
    config,
    logger: pino({ level: 'silent' }),
    userId,
  };
  const app = createApp(ctx);
  return { app, ctx, clock, request: supertest(app), close: () => handle.close() };
}

export type TestApp = ReturnType<typeof createTestApp>;
