import { existsSync, rmSync } from 'node:fs';
import { loadConfig, loadDotEnv } from '../../../config/env';
import { systemClock } from '../../clock';
import { openDatabase } from '../client';
import { runMigrations } from '../migrate';
import { seedAll } from '../seed';

loadDotEnv();
const config = loadConfig();

if (!process.argv.includes('--yes')) {
  console.error(
    `This permanently deletes ${config.databasePath}, including all progress, notes and sessions.\n` +
      'Run `pnpm db:backup` first, then repeat with: pnpm db:reset -- --yes',
  );
  process.exit(1);
}

if (config.databasePath !== ':memory:') {
  for (const suffix of ['', '-wal', '-shm', '-journal']) {
    const file = `${config.databasePath}${suffix}`;
    if (existsSync(file)) rmSync(file);
  }
}

const handle = openDatabase(config.databasePath);
runMigrations(handle.db);
const result = seedAll(handle.db, { config, clock: systemClock });
console.log(`Database recreated with ${result.lessons} lessons and a fresh 24-week plan.`);
handle.close();
