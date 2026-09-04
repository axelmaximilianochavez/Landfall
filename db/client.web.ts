import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

import type * as schema from './schema';

/**
 * Web has no database.
 *
 * drizzle-orm/expo-sqlite is a synchronous driver (openDatabaseSync,
 * prepareSync, runSync). expo-sqlite's web build implements those by
 * marshalling to a worker and spin-blocking the main thread on a
 * SharedArrayBuffer for a fixed ~1e6 Atomics.pause() iterations — far less
 * than a worker boot plus a 617 KB wasm compile needs, so the very first
 * openDatabaseSync throws "Sync operation timeout". Expo documents its web
 * support as alpha.
 *
 * Metro picks this file for platform=web, so `pnpm web` still renders the UI
 * (useful for styling work) and only database access fails, loudly.
 */
export const DATABASE_NAME = 'landfall.db';

export const isDatabaseAvailable = false;

const unavailable = () => {
  throw new Error(
    'The database is not available on web. drizzle-orm/expo-sqlite requires ' +
      "expo-sqlite's synchronous API, which its web build cannot serve. Run on " +
      'iOS or Android, or guard this code with `isDatabaseAvailable`.',
  );
};

export const db = new Proxy({} as ExpoSQLiteDatabase<typeof schema>, {
  get: unavailable,
  has: unavailable,
  ownKeys: unavailable,
}) as ExpoSQLiteDatabase<typeof schema>;
