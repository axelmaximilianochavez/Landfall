import type { Person, Trip } from '../schema';

export type InvitedTrip = Trip & { people: Person[] };

/** No database on web (see db/client.web.ts), so no invite can be resolved. */
export function useTripByInviteCode(_code: string): {
  trip: InvitedTrip | undefined;
  loading: boolean;
} {
  return { trip: undefined, loading: false };
}

export function joinTrip(_input: { tripId: string; name: string; email: string }): string {
  throw new Error('Joining is unavailable on web. Open the link on iOS or Android.');
}
