import { sql } from 'drizzle-orm';
import { integer, text } from 'drizzle-orm/sqlite-core';

/**
 * Every table gets these. They cost nothing now and make the phase-2
 * sync possible without a migration.
 *
 * - id: client-generated UUID (expo-crypto randomUUID), never autoincrement
 * - deletedAt: soft delete, so a device can tell the server "this went away"
 *
 * Timestamps are epoch ms. unixepoch() alone returns whole SECONDS, so
 * `unixepoch() * 1000` would peg every insert to a .000 boundary and make
 * created_at useless as a tiebreaker — and it would disagree with the
 * millisecond precision $onUpdate writes. 'subsec' (SQLite 3.42+; 3.50.3
 * ships in expo-sqlite 16) gives real milliseconds.
 */
export const base = () => ({
  id: text('id').primaryKey(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(CAST(unixepoch('subsec') * 1000 AS INTEGER))`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(CAST(unixepoch('subsec') * 1000 AS INTEGER))`)
    // The SQL default only fires on INSERT. Without this, updated_at never
    // moves after creation and the phase-2 sync cannot tell what changed.
    .$onUpdate(() => new Date()),
  deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }),
});
