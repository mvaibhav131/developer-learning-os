import { loadConfig, loadDotEnv } from '../../../config/env';
import { openDatabase } from '../client';
import { resolveMigrationsDir, runMigrations } from '../migrate';

loadDotEnv();
const config = loadConfig();
const handle = openDatabase(config.databasePath);
runMigrations(handle.db, resolveMigrationsDir());
console.log(`Migrations are up to date: ${config.databasePath}`);
handle.close();
