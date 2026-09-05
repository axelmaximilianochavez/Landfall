import { desc, isNull } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { newId } from '@/lib/id';

import { db } from '../client';
import { people, segments, trips, type Person, type Trip } from '../schema';

export type TripWithPeople = Trip & { people: Person[] };
export type TripsResult = { data: TripWithPeople[]; error?: Error };

/**
 * Live list of trips with their travellers, for the avatar stack on each card.
 *
 * Filters soft-deleted rows. Not filtered by account yet: trips.ownerUserId is
 * null while the app is local-only, so every trip on this device is "mine".
 */
export function useTrips(): TripsResult {
  const { data, error } = useLiveQuery(
    db.query.trips.findMany({
      where: isNull(trips.deletedAt),
      orderBy: [desc(trips.createdAt)],
      with: { people: true },
    })
  );
  return { data: (data ?? []) as TripWithPeople[], error };
}

export type NewCountry = { name: string; startDate?: string | null; endDate?: string | null };

export type NewTripInput = {
  title: string;
  startDate?: string | null;
  endDate?: string | null;
  baseCurrency?: string;
  /** Country legs in visiting order. */
  countries?: NewCountry[];
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
  countries = [],
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

    countries.forEach((country, index) => {
      tx.insert(segments)
        .values({
          id: newId(),
          tripId,
          name: country.name,
          startDate: country.startDate ?? null,
          endDate: country.endDate ?? null,
          sortOrder: index,
        })
        .run();
    });
  });

  return tripId;
}
