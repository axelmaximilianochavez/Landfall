import { drizzle, type ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

export const DATABASE_NAME = 'landfall.db';

/** False on web — see client.web.ts. */
export const isDatabaseAvailable = true;

// enableChangeListener is required for drizzle's useLiveQuery hook
const expoDb = openDatabaseSync(DATABASE_NAME, { enableChangeListener: true });

// SQLite disables foreign key enforcement by default, per connection. Without
// this every `onDelete` rule in the schema is silently inert.
expoDb.execSync('PRAGMA foreign_keys = ON;');

export const db: ExpoSQLiteDatabase<typeof schema> = drizzle(expoDb, { schema });
