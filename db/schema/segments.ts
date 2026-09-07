import { relations } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { base } from './_base';
import { trips } from './trips';

/**
 * A destination on the trip, in visiting order — the "Destinations · in order"
 * list on the New trip screen, and the pills above the timeline.
 *
 * Deliberately not "country": a destination can be a country, a city, or a
 * single neighbourhood, so a weekend in two districts of Tokyo works the same
 * way as a two-country trip. countryCode stays optional for the cases where
 * one applies.
 *
 * Items are grouped under a segment by comparing dates rather than carrying a
 * segment FK: an item's date already decides which leg it falls in, and a FK
 * would let the two disagree.
 */
export const segments = sqliteTable(
  'segments',
  {
    ...base(),
    tripId: text('trip_id')
      .notNull()
      .references(() => trips.id, { onDelete: 'cascade' }),

    name: text('name').notNull(), // 'Japan', 'Tokyo', 'Shibuya'
    countryCode: text('country_code'), // ISO 3166-1 alpha-2

    // Local dates, 'YYYY-MM-DD' — calendar facts, like trips.startDate.
    startDate: text('start_date'),
    endDate: text('end_date'),

    sortOrder: integer('sort_order').notNull().default(0),
  },
  (t) => [index('segments_trip_order_idx').on(t.tripId, t.sortOrder)]
);

export const segmentsRelations = relations(segments, ({ one }) => ({
  trip: one(trips, { fields: [segments.tripId], references: [trips.id] }),
}));

export type Segment = typeof segments.$inferSelect;
export type NewSegment = typeof segments.$inferInsert;
