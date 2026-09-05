import type { Item, ItemDetails, ItemKind, Person, Place, Segment, Trip } from '../schema';

export type TimelineItem = Item & { fromPlace: Place | null; toPlace: Place | null };
export type FullTrip = Trip & { segments: Segment[]; people: Person[]; items: TimelineItem[] };

export type NewItemInput = {
  tripId: string;
  kind: ItemKind;
  title: string;
  startAt?: Date | null;
  endAt?: Date | null;
  isAllDay?: boolean;
  notes?: string | null;
  details?: ItemDetails | null;
  personIds?: string[];
};

const unavailable = () => {
  throw new Error('The database is unavailable on web. Run on iOS or Android.');
};

/** No database on web (see db/client.web.ts). */
export function useTrip(_tripId: string): { trip: FullTrip | undefined; error?: Error } {
  return { trip: undefined };
}

export function createItem(_input: NewItemInput): string {
  return unavailable();
}

export function addPerson(_tripId: string, _displayName: string, _email?: string | null): string {
  return unavailable();
}

export function deleteItem(_itemId: string): void {
  unavailable();
}
