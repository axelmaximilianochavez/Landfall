import { relations } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { base } from './_base';
import { expenses } from './expenses';
import { places } from './places';
import { trips } from './trips';

export type ItemKind = 'flight' | 'lodging' | 'transport' | 'activity';

/** Per-kind extra fields, stored as JSON in items.details. */
export type ItemDetails =
  | {
      kind: 'flight';
      airline?: string;
      flightNumber?: string;
      confirmationCode?: string;
      seat?: string;
      departureTerminal?: string;
      arrivalTerminal?: string;
      baggageAllowance?: string;
    }
  | {
      kind: 'lodging';
      confirmationCode?: string;
      roomType?: string;
      phone?: string;
      checkInInstructions?: string;
    }
  | {
      kind: 'transport';
      mode?: 'train' | 'bus' | 'ferry' | 'car' | 'taxi' | 'walk';
      operator?: string;
      confirmationCode?: string;
      platform?: string;
    }
  | {
      kind: 'activity';
      category?: string;
      url?: string;
      bookingRequired?: boolean;
    };

/**
 * The itinerary timeline. One table for every kind of entry.
 *
 * Why not four tables: the primary screen is a single chronological
 * timeline mixing flights, hotels and activities. One table means one
 * ORDER BY start_at query. Four tables means four queries merged and
 * re-sorted in JS on every render, and pagination becomes miserable.
 *
 * The shared, queryable fields are real columns. The per-kind fields
 * live in a typed JSON blob, because you never filter or sort by
 * "baggage allowance".
 */
export const items = sqliteTable(
  'items',
  {
    ...base(),
    tripId: text('trip_id')
      .notNull()
      .references(() => trips.id, { onDelete: 'cascade' }),

    kind: text('kind').$type<ItemKind>().notNull(),
    title: text('title').notNull(),

    // Absolute instants (epoch ms, UTC). Unambiguous across borders.
    // Render them using the timezone of the associated place.
    startAt: integer('start_at', { mode: 'timestamp_ms' }),
    endAt: integer('end_at', { mode: 'timestamp_ms' }),

    // Set when the user entered a date but no clock time, so the UI
    // knows to show "Mar 3" rather than "Mar 3, 00:00".
    isAllDay: integer('is_all_day', { mode: 'boolean' })
      .notNull()
      .default(false),

    // fromPlace: departure airport / the hotel / the activity location.
    // toPlace:   arrival airport / destination. Null for lodging+activity.
    fromPlaceId: text('from_place_id').references(() => places.id, {
      onDelete: 'set null',
    }),
    toPlaceId: text('to_place_id').references(() => places.id, {
      onDelete: 'set null',
    }),

    // Manual tiebreaker for items sharing a start time, or with none.
    sortOrder: integer('sort_order').notNull().default(0),

    details: text('details', { mode: 'json' }).$type<ItemDetails>(),
    notes: text('notes'),
  },
  (t) => [
    // The timeline query: WHERE trip_id = ? ORDER BY start_at, sort_order
    index('items_trip_start_idx').on(t.tripId, t.startAt, t.sortOrder),
    index('items_trip_kind_idx').on(t.tripId, t.kind),
  ],
);

export const itemsRelations = relations(items, ({ one, many }) => ({
  trip: one(trips, { fields: [items.tripId], references: [trips.id] }),
  fromPlace: one(places, {
    fields: [items.fromPlaceId],
    references: [places.id],
    relationName: 'fromPlace',
  }),
  toPlace: one(places, {
    fields: [items.toPlaceId],
    references: [places.id],
    relationName: 'toPlace',
  }),
  expenses: many(expenses),
}));

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
