import { relations } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { base } from './_base';
import { expenses } from './expenses';
import { itemPeople } from './item-people';
import { segments } from './segments';
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
      gate?: string;
      /** Endpoints as typed. The title is derived from these, not the reverse. */
      from?: string;
      to?: string;
      departureTerminal?: string;
      arrivalTerminal?: string;
      baggageAllowance?: string;

      /**
       * Filled by the AeroDataBox lookup (lib/flight-lookup.ts). Cached rather
       * than fetched on render: the free plan is rate limited, and a flight's
       * airline and aircraft do not change. Refreshed on demand from the
       * detail screen, which is when a gate or terminal change matters.
       */
      airportFromName?: string;
      airportToName?: string;
      cityFrom?: string;
      cityTo?: string;
      countryFrom?: string;
      countryTo?: string;
      aircraft?: string;
      distanceKm?: number;
      durationMinutes?: number;
      /** Live status from the last refresh, e.g. 'Expected', 'EnRoute'. */
      liveStatus?: string;
      /** Revised clock times, only when they differ from the schedule. */
      revisedDeparture?: string;
      revisedArrival?: string;
      /** Airport coordinates, for drawing the route. */
      fromLat?: number;
      fromLon?: number;
      toLat?: number;
      toLon?: number;
      /** ISO timestamp of the last successful lookup. */
      lookedUpAt?: string;
    }
  | {
      kind: 'lodging';
      confirmationCode?: string;
      address?: string;
      /** Free text, e.g. '704 · Twin'. */
      room?: string;
      roomType?: string;
      phone?: string;
      checkInInstructions?: string;
    }
  | {
      kind: 'transport';
      mode?: 'train' | 'bus' | 'ferry' | 'car' | 'taxi' | 'walk';
      operator?: string;
      confirmationCode?: string;
      from?: string;
      to?: string;
      departureTerminal?: string;
      arrivalTerminal?: string;
      /** Carriage number. */
      car?: string;
      seat?: string;
      platform?: string;
    }
  | {
      kind: 'activity';
      category?: string;
      address?: string;
      /** Free text, e.g. '06:00 – 17:00'. */
      openingHours?: string;
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

    // Which destination this belongs to, chosen on the add screen.
    // Nullable, and grouping falls back to comparing dates when it is null —
    // an undated item still needs a home, which dates alone cannot give it.
    // ON DELETE set null: removing a destination must not delete its items.
    segmentId: text('segment_id').references(() => segments.id, { onDelete: 'set null' }),

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
    index('items_segment_idx').on(t.segmentId),
  ],
);

export const itemsRelations = relations(items, ({ one, many }) => ({
  trip: one(trips, { fields: [items.tripId], references: [trips.id] }),
  segment: one(segments, { fields: [items.segmentId], references: [segments.id] }),
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
  people: many(itemPeople),
}));

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
