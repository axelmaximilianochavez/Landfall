import { and, asc, eq, getTableName, isNull } from 'drizzle-orm';

import { newId } from '@/lib/id';

import { db } from '../client';
import { useLiveTables } from '../live';
import {
  expenseShares,
  expenses,
  itemPeople,
  items,
  people,
  places,
  segments,
  trips,
  type Item,
  type ItemDetails,
  type ItemKind,
  type Expense,
  type ExpenseShare,
  type Person,
  type Place,
  type Segment,
  type Trip,
} from '../schema';

export type TimelineItem = Item & {
  fromPlace: Place | null;
  toPlace: Place | null;
  people: { personId: string }[];
};
export type TripExpense = Expense & { shares: ExpenseShare[] };
export type FullTrip = Trip & {
  segments: Segment[];
  people: Person[];
  items: TimelineItem[];
  expenses: TripExpense[];
};

// Every table this read touches, so adding an item refreshes the timeline
// without leaving the screen.
const TRIP_TABLES = [
  trips,
  segments,
  people,
  items,
  places,
  itemPeople,
  expenses,
  expenseShares,
].map(getTableName);

/** One trip with everything the detail screen renders, kept live. */
export function useTrip(tripId: string): { trip: FullTrip | undefined; error?: Error } {
  const { data, error } = useLiveTables(
    () =>
      db.query.trips.findFirst({
        where: and(eq(trips.id, tripId), isNull(trips.deletedAt)),
        with: {
          segments: { orderBy: [asc(segments.sortOrder)] },
          people: true,
          items: {
            where: isNull(items.deletedAt),
            orderBy: [asc(items.startAt), asc(items.sortOrder)],
            with: { fromPlace: true, toPlace: true, people: true },
          },
          expenses: {
            where: isNull(expenses.deletedAt),
            orderBy: [asc(expenses.spentAt)],
            with: { shares: true },
          },
        },
      }),
    TRIP_TABLES,
    [tripId]
  );
  return { trip: data as FullTrip | undefined, error };
}

export type NewItemInput = {
  tripId: string;
  /** Destination this belongs to. Null falls back to grouping by date. */
  segmentId?: string | null;
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
  segmentId = null,
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
      .values({ id: itemId, tripId, segmentId, kind, title, startAt, endAt, isAllDay, notes, details })
      .run();

    for (const personId of personIds) {
      tx.insert(itemPeople).values({ id: newId(), itemId, personId }).run();
    }
  });

  return itemId;
}

export type UpdateItemInput = Omit<NewItemInput, 'tripId'> & { id: string };

/**
 * Rewrites an item and its passenger list.
 *
 * The passenger list is replaced wholesale rather than diffed: the set is
 * tiny, and a delete-then-insert inside one transaction cannot leave a
 * half-updated list behind the way a diff can.
 */
export function updateItem({
  id,
  segmentId = null,
  kind,
  title,
  startAt = null,
  endAt = null,
  isAllDay = false,
  notes = null,
  details = null,
  personIds = [],
}: UpdateItemInput): void {
  db.transaction((tx) => {
    tx.update(items)
      .set({ segmentId, kind, title, startAt, endAt, isAllDay, notes, details })
      .where(eq(items.id, id))
      .run();

    tx.delete(itemPeople).where(eq(itemPeople.itemId, id)).run();
    for (const personId of personIds) {
      tx.insert(itemPeople).values({ id: newId(), itemId: id, personId }).run();
    }
  });
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

/** Merges fresh lookup data into a flight's details, leaving the rest alone. */
export function updateItemDetails(itemId: string, details: ItemDetails): void {
  db.update(items).set({ details }).where(eq(items.id, itemId)).run();
}

/**
 * Records that an invite went out to `email`.
 *
 * There is no server to actually send it yet — this only moves the person into
 * the pending state so the UI reflects the intent. Resending rewrites the
 * timestamp, because what matters is how stale the outstanding invite is.
 */
export function invitePerson(personId: string, email: string): void {
  db.update(people)
    .set({ email: email.trim(), invitedAt: new Date() })
    .where(eq(people.id, personId))
    .run();
}

/** Bumps the invite timestamp, keeping the existing address. */
export function resendInvite(personId: string): void {
  db.update(people).set({ invitedAt: new Date() }).where(eq(people.id, personId)).run();
}

/** Soft-deletes an item, so a future sync can propagate the removal. */
export function deleteItem(itemId: string): void {
  db.update(items).set({ deletedAt: new Date() }).where(eq(items.id, itemId)).run();
}
