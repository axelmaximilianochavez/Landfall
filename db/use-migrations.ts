import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';

import migrations from '../drizzle/migrations';
import { db } from './client';

/** Runs pending migrations. On web this is a no-op — see use-migrations.web.ts. */
export function useDatabaseMigrations(): { success: boolean; error?: Error } {
  return useMigrations(db, migrations);
}
