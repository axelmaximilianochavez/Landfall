import { addDatabaseChangeListener } from 'expo-sqlite';
import { useEffect, useState } from 'react';

type LiveResult<T> = { data: T | undefined; error?: Error; updatedAt?: Date };

/**
 * A live query that re-runs when ANY of the given tables changes.
 *
 * drizzle's own useLiveQuery watches only the query's root table, so a
 * relational read like `db.query.trips.findFirst({ with: { items } })` never
 * refreshes when an item is inserted — the change event names `items`, the
 * listener is comparing against `trips`. Anything with a `with:` clause needs
 * this instead.
 *
 * Pass table names via getTableName(schema.x) rather than string literals, so
 * a rename cannot silently stop the updates.
 */
export function useLiveTables<T>(
  runQuery: () => PromiseLike<T>,
  tables: string[],
  deps: unknown[] = []
): LiveResult<T> {
  const [result, setResult] = useState<LiveResult<T>>({ data: undefined });

  useEffect(() => {
    let active = true;
    const watched = new Set(tables);

    const run = () => {
      Promise.resolve(runQuery()).then(
        (data) => {
          if (active) setResult({ data, updatedAt: new Date() });
        },
        (error: Error) => {
          if (active) setResult((prev) => ({ ...prev, error }));
        }
      );
    };

    run();
    const listener = addDatabaseChangeListener(({ tableName }) => {
      if (watched.has(tableName)) run();
    });

    return () => {
      active = false;
      listener.remove();
    };
    // runQuery is rebuilt every render; `deps` is the real dependency list,
    // matching how drizzle's own useLiveQuery is used.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return result;
}
