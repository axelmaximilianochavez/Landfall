import { and, asc, eq, isNull } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { newId } from '@/lib/id';

import { db } from '../client';
import {
  itemPeople,
  items,
  people,
  segments,
  trips,
  type Item,
  type ItemDetails,
  type ItemKind,
  type Person,
  type Place,
  type Segment,
  type Trip,
} from '../schema';

export type TimelineItem = Item & { fromPlace: Place | null; toPlace: Place | null };
export type FullTrip = Trip & {
  segments: Segment[];
  people: Person[];
  items: TimelineItem[];
};

/** One trip with everything the detail screen renders, kept live. */
export function useTrip(tripId: string): { trip: FullTrip | undefined; error?: Error } {
  const { data, error } = useLiveQuery(
    db.query.trips.findFirst({
      where: and(eq(trips.id, tripId), isNull(trips.deletedAt)),
      with: {
        segments: { orderBy: [asc(segments.sortOrder)] },
        people: true,
        items: {
          where: isNull(items.deletedAt),
          orderBy: [asc(items.startAt), asc(items.sortOrder)],
          with: { fromPlace: true, toPlace: true },
        },
      },
    }),
    [tripId]
  );
  return { trip: data as FullTrip | undefined, error };
}

export type NewItemInput = {
  tripId: string;
  kind: ItemKind;
  title: string;
  startAt?: Date | null;
  endAt?: Date | null;
  isAllDay?: boolean;
  notes?: string | null;
  details?: ItemDetails | null;
  /** People on this item. Empty means "everyone", which we do not store. */
  personIds?: string[];
};

/** Adds an itinerary item and its passenger list in one transaction. */
export function createItem({
  tripId,
  kind,
  title,
  startAt = null,
  endAt = null,
  isAllDay = false,
  notes = null,
  details = null,
  personIds = [],
}: NewItemInput): string {
  const itemId = newId();

  db.transaction((tx) => {
    tx.insert(items)
      .values({ id: itemId, tripId, kind, title, startAt, endAt, isAllDay, notes, details })
      .run();

    for (const personId of personIds) {
      tx.insert(itemPeople).values({ id: newId(), itemId, personId }).run();
    }
  });

  return itemId;
}

/** Adds a traveller to an existing trip. */
export function addPerson(tripId: string, displayName: string, email?: string | null): string {
  const id = newId();
  db.insert(people)
    .values({
      id,
      tripId,
      displayName,
      email: email ?? null,
      invitedAt: email ? new Date() : null,
    })
    .run();
  return id;
}

/** Soft-deletes an item, so a future sync can propagate the removal. */
export function deleteItem(itemId: string): void {
  db.update(items).set({ deletedAt: new Date() }).where(eq(items.id, itemId)).run();
}
