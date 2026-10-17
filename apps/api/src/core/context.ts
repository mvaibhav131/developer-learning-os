import { formatLocalDate } from '@dlos/shared';
import type { AppConfig } from '../config/env';
import type { Clock } from './clock';
import type { Db } from './db/client';
import type { Logger } from './logger';

/** Everything a feature needs. The app serves a single local profile, so `userId` is fixed at startup. */
export interface AppContext {
  db: Db;
  clock: Clock;
  config: AppConfig;
  logger: Logger;
  userId: number;
}

export function todayIn(ctx: Pick<AppContext, 'clock'>, timeZone: string): string {
  return formatLocalDate(ctx.clock.now(), timeZone);
}

export function nowIso(ctx: Pick<AppContext, 'clock'>): string {
  return ctx.clock.now().toISOString();
}
