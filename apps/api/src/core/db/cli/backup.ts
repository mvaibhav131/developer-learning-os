import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { loadConfig, loadDotEnv } from '../../../config/env';
import { openDatabase } from '../client';

loadDotEnv();
const config = loadConfig();

if (config.databasePath === ':memory:' || !existsSync(config.databasePath)) {
  console.error('There is no database file to back up yet. Start the API once first.');
  process.exit(1);
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupDir = path.join(path.dirname(config.databasePath), 'backups');
mkdirSync(backupDir, { recursive: true });
const target = path.join(backupDir, `dlos-${stamp}.sqlite`);

const handle = openDatabase(config.databasePath);
await handle.sqlite.backup(target);
handle.close();
console.log(`Backup written to ${target}`);
