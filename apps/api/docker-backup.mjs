// Writes a consistent copy of the live database into a backups folder next to it.
//   docker compose exec app node docker-backup.mjs
// The database runs in WAL mode, so copying the file while the app is running is not safe. SQLite's backup API is.

import { mkdirSync } from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

const source = process.env.DATABASE_PATH || '/data/dlos.sqlite';
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const folder = path.join(path.dirname(source), 'backups');
const target = path.join(folder, `dlos-${stamp}.sqlite`);

mkdirSync(folder, { recursive: true });
try {
  await new Database(source, { fileMustExist: true }).backup(target);
  console.log(`Backup written to ${target}`);
} catch (error) {
  console.error(`Backup failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
