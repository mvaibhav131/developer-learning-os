import { loadConfig, loadDotEnv } from './config/env';
import { createApp } from './app';
import { systemClock } from './core/clock';
import { openDatabase } from './core/db/client';
import { runMigrations } from './core/db/migrate';
import { ensureOwnerProfile, seedAll } from './core/db/seed';
import { createLogger } from './core/logger';
import type { AppContext } from './core/context';

function main(): void {
  loadDotEnv();
  const config = loadConfig();
  const logger = createLogger(config);

  const handle = openDatabase(config.databasePath);
  if (config.autoMigrate) runMigrations(handle.db);
  const userId = config.autoSeed
    ? seedAll(handle.db, { config, clock: systemClock }).userId
    : ensureOwnerProfile(handle.db, {
        displayName: config.ownerDisplayName,
        timezone: config.timezone,
        now: systemClock.now().toISOString(),
      });

  const ctx: AppContext = { db: handle.db, clock: systemClock, config, logger, userId };
  const app = createApp(ctx);
  const server = app.listen(config.port, config.host, () => {
    const base = `http://${config.host}:${config.port}`;
    logger.info({ url: base, docs: `${base}/api/docs` }, 'Developer Learning OS API is ready');
  });

  const shutdown = (signal: string) => {
    logger.info({ signal }, 'Shutting down');
    server.close(() => {
      handle.close();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 5_000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main();
