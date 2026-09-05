import { useDrizzleStudio } from 'expo-drizzle-studio-plugin';

import { sqliteDb } from './client';

/**
 * Exposes the on-device database to Drizzle Studio while developing.
 * Open it with `shift + m` in the `expo start` terminal.
 *
 * The plugin is not __DEV__ guarded upstream, and it serves arbitrary SQL over
 * the dev-tools channel, so pass null outside development to keep it closed.
 */
export function useDatabaseInspector(): void {
  useDrizzleStudio(__DEV__ ? sqliteDb : null);
}
