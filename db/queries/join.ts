import { getTableName, isNull } from 'drizzle-orm';

import { inviteCodeForTrip } from '@/lib/invite';
import { newId } from '@/lib/id';

import { db } from '../client';
import { useLiveTables } from '../live';
import { people, trips, type Person, type Trip } from '../schema';

export type InvitedTrip = Trip & { people: Person[] };

const JOIN_TABLES = [trips, people].map(getTableName);

/**
 * Resolves an invite code back to a trip.
 *
 * The code is derived one-way from the trip id, so there is nothing to look it
 * up by — every local trip is checked instead. That is fine for the handful of
 * trips on one device, and it is the wrong shape entirely once there is a
 * server: the person opening an invite normally does NOT have the trip locally,
 * which is why this only resolves while testing on the device that made it.
 */
export function useTripByInviteCode(code: string): {
  trip: InvitedTrip | undefined;
  loading: boolean;
} {
  const { data, updatedAt } = useLiveTables(
    () => db.query.trips.findMany({ where: isNull(trips.deletedAt), with: { people: true } }),
    JOIN_TABLES
  );

  const wanted = code.trim().toUpperCase();
  const trip = (data as InvitedTrip[] | undefined)?.find(
    (candidate) => inviteCodeForTrip(candidate.id) === wanted
  );

  return { trip, loading: !updatedAt };
}

/**
 * Adds whoever opened the link to the trip.
 *
 * userId is filled with a `local:` stand-in because there are no accounts yet,
 * and the row would otherwise read as "not invited". Real auth must replace
 * these — treat any `local:` prefix as "not actually linked to an account".
 */
export function joinTrip({
  tripId,
  name,
  email,
}: {
  tripId: string;
  name: string;
  email: string;
}): string {
  const id = newId();
  db.insert(people)
    .values({
      id,
      tripId,
      displayName: name.trim(),
      email: email.trim(),
      userId: `local:${newId()}`,
    })
    .run();
  return id;
}
