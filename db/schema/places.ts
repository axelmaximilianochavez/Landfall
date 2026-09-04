import { relations } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { base } from './_base';
import { trips } from './trips';

/**
 * Every point that can open in Google Maps.
 *
 * One table for ALL locations: airports, hotel addresses, restaurants,
 * "that viewpoint someone recommended". Items reference these rather
 * than carrying their own lat/lng columns.
 *
 * Why: you write the open-in-Maps logic and the place picker exactly
 * once, and a flight can point at two of them (departure + arrival)
 * without duplicating four columns.
 */
export const places = sqliteTable(
  'places',
  {
    ...base(),
    tripId: text('trip_id')
      .notNull()
      .references(() => trips.id, { onDelete: 'cascade' }),

    name: text('name').notNull(),
    address: text('address'),

    // Micro-degrees: degrees * 1e6, so 35.6812 -> 35681200. Integers
    // because these get compared and keyed; SQLite ints are 64-bit so
    // there is no precision risk at this scale.
    lat: integer('lat'),
    lng: integer('lng'),

    // If it came from the Places API, keep the id — it's the most
    // reliable way to build a maps deep link later.
    googlePlaceId: text('google_place_id'),

    // IANA zone, e.g. 'Asia/Tokyo'. Needed to render local times.
    timezone: text('timezone'),

    countryCode: text('country_code'), // ISO 3166-1 alpha-2

    // True for places the user saved as "want to visit" but hasn't
    // scheduled into the itinerary yet.
    isWishlist: integer('is_wishlist', { mode: 'boolean' })
      .notNull()
      .default(false),

    notes: text('notes'),
  },
  (t) => [
    index('places_trip_idx').on(t.tripId),
    index('places_wishlist_idx').on(t.tripId, t.isWishlist),
  ],
);

export const placesRelations = relations(places, ({ one }) => ({
  trip: one(trips, { fields: [places.tripId], references: [trips.id] }),
}));

export type Place = typeof places.$inferSelect;
export type NewPlace = typeof places.$inferInsert;
