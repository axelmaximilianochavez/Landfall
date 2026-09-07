import type {
  Expense,
  ExpenseShare,
  Item,
  ItemDetails,
  ItemKind,
  Person,
  Place,
  Segment,
  Trip,
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
  personIds?: string[];
};

const unavailable = () => {
  throw new Error('The database is unavailable on web. Run on iOS or Android.');
};

/** No database on web (see db/client.web.ts). */
export function useTrip(_tripId: string): { trip: FullTrip | undefined; error?: Error } {
  return { trip: undefined };
}

export type UpdateItemInput = Omit<NewItemInput, 'tripId'> & { id: string };

export function createItem(_input: NewItemInput): string {
  return unavailable();
}

export function updateItem(_input: UpdateItemInput): void {
  unavailable();
}

export function addPerson(_tripId: string, _displayName: string, _email?: string | null): string {
  return unavailable();
}

export function deleteItem(_itemId: string): void {
  unavailable();
}

export function updateItemDetails(_itemId: string, _details: ItemDetails): void {
  unavailable();
}

export function invitePerson(_personId: string, _email: string): void {
  unavailable();
}

export function resendInvite(_personId: string): void {
  unavailable();
}
