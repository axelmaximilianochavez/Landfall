import { desc, eq, getTableName, isNull } from 'drizzle-orm';

import { newId } from '@/lib/id';

import { db } from '../client';
import { useLiveTables } from '../live';
import { people, segments, trips, type Person, type Trip } from '../schema';

export type TripWithPeople = Trip & { people: Person[] };
export type TripsResult = { data: TripWithPeople[]; error?: Error };

/**
 * Live list of trips with their travellers, for the avatar stack on each card.
 *
 * Filters soft-deleted rows. Not filtered by account yet: trips.ownerUserId is
 * null while the app is local-only, so every trip on this device is "mine".
 */
// Watches people too, so the avatar stack updates when travellers change.
const TRIPS_TABLES = [trips, people].map(getTableName);

export function useTrips(): TripsResult {
  const { data, error } = useLiveTables(
    () =>
      db.query.trips.findMany({
        where: isNull(trips.deletedAt),
        orderBy: [desc(trips.createdAt)],
        with: { people: true },
      }),
    TRIPS_TABLES
  );
  return { data: (data ?? []) as TripWithPeople[], error };
}

/** A leg of the trip: a country, a city, or a single neighbourhood. */
export type NewDestination = { name: string; startDate?: string | null; endDate?: string | null };

export type NewTripInput = {
  title: string;
  startDate?: string | null;
  endDate?: string | null;
  baseCurrency?: string;
  /** Destinations in visiting order. */
  destinations?: NewDestination[];
  /** Names of the people coming along, besides you. */
  companions?: string[];
};

/**
 * Creates a trip and its owner person in one transaction, returning the trip id.
 *
 * The person row is not optional: db/schema/people.ts requires exactly one
 * `isSelf` person per trip, and expenses reference people, so a trip without
 * one cannot record a single expense. "Me" is a placeholder until there are
 * real accounts.
 *
 * Synchronous because drizzle's expo-sqlite driver is a sync driver.
 */
export function createTrip({
  title,
  startDate = null,
  endDate = null,
  baseCurrency,
  destinations = [],
  companions = [],
}: NewTripInput): string {
  const tripId = newId();

  db.transaction((tx) => {
    tx.insert(trips)
      .values({ id: tripId, title, startDate, endDate, ...(baseCurrency ? { baseCurrency } : {}) })
      .run();

    tx.insert(people)
      .values({ id: newId(), tripId, displayName: 'Me', isSelf: true })
      .run();

    for (const name of companions) {
      tx.insert(people).values({ id: newId(), tripId, displayName: name }).run();
    }

    destinations.forEach((destination, index) => {
      tx.insert(segments)
        .values({
          id: newId(),
          tripId,
          name: destination.name,
          startDate: destination.startDate ?? null,
          endDate: destination.endDate ?? null,
          sortOrder: index,
        })
        .run();
    });
  });

  return tripId;
}

/**
 * Soft-deletes a trip, taking everything inside it out of the app with it.
 *
 * Only the trip row is touched: every read of items, people, segments and
 * expenses goes through the trip, so once it is out of `useTrips` and
 * `useTrip` none of them are reachable. That is also the only way this can be
 * one statement — the child tables are `ON DELETE RESTRICT`, so a hard delete
 * would have to unwind them in dependency order and would be unrecoverable if
 * it stopped halfway. The rows stay on disk for a future sync to propagate,
 * exactly as `deleteItem` leaves them.
 */
export function deleteTrip(tripId: string): void {
  db.update(trips).set({ deletedAt: new Date() }).where(eq(trips.id, tripId)).run();
}
