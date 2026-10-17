import { existsSync } from 'node:fs';
import path from 'node:path';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import type { Db } from './client';

/** Finds `apps/api/drizzle` from both the source tree and the bundled `dist` output. */
export function resolveMigrationsDir(): string {
  const fromEnv = process.env.MIGRATIONS_DIR;
  if (fromEnv) return path.resolve(fromEnv);
  let dir = import.meta.dirname;
  for (let depth = 0; depth < 6; depth += 1) {
    const candidate = path.join(dir, 'drizzle');
    if (existsSync(path.join(candidate, 'meta', '_journal.json'))) return candidate;
    dir = path.dirname(dir);
  }
  throw new Error('Could not locate the Drizzle migrations folder. Set MIGRATIONS_DIR.');
}

export function runMigrations(db: Db, migrationsFolder: string = resolveMigrationsDir()): void {
  migrate(db, { migrationsFolder });
}
