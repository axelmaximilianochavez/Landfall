import type { Person, Trip } from '../schema';

export type TripWithPeople = Trip & { people: Person[] };
export type TripsResult = { data: TripWithPeople[]; error?: Error };
export type NewCountry = { name: string; startDate?: string | null; endDate?: string | null };

export type NewTripInput = {
  title: string;
  startDate?: string | null;
  endDate?: string | null;
  baseCurrency?: string;
  countries?: NewCountry[];
  companions?: string[];
};

/** No database on web (see db/client.web.ts), so there are never any trips. */
export function useTrips(): TripsResult {
  return { data: [] };
}

export function createTrip(_input: NewTripInput): string {
  throw new Error(
    'Cannot create a trip on web: the database is unavailable there. Run on iOS or Android.'
  );
}
