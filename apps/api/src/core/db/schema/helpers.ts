import { sql } from 'drizzle-orm';
import { integer, text } from 'drizzle-orm/sqlite-core';

const NOW_SQL = sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;

export const pk = () => integer('id').primaryKey({ autoIncrement: true });
export const createdAt = () => text('created_at').notNull().default(NOW_SQL);
export const updatedAt = () => text('updated_at').notNull().default(NOW_SQL);
export const jsonColumn = <T>(name: string) => text(name, { mode: 'json' }).$type<T>();
