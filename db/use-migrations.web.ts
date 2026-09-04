/**
 * Web has no database (see client.web.ts), so there is nothing to migrate.
 * Reporting success lets the UI render instead of hanging on a spinner.
 */
export function useDatabaseMigrations(): { success: boolean; error?: Error } {
  return { success: true };
}
