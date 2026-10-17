import { loadConfig, loadDotEnv } from '../../../config/env';
import { systemClock } from '../../clock';
import { openDatabase } from '../client';
import { runMigrations } from '../migrate';
import { seedAll } from '../seed';

loadDotEnv();
const config = loadConfig();
const handle = openDatabase(config.databasePath);
runMigrations(handle.db);
const result = seedAll(handle.db, { config, clock: systemClock });
console.log(
  `Seeded ${result.lessons} lessons for user #${result.userId}` +
    (result.planCreated ? ' and created the 24-week plan.' : '; the existing plan was kept.'),
);
handle.close();
