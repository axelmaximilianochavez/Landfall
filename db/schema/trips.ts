import { relations } from 'drizzle-orm';
import { index, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { base } from './_base';
import { expenses } from './expenses';
import { items } from './items';
import { people } from './people';
import { places } from './places';

export const trips = sqliteTable(
  'trips',
  {
    ...base(),
    title: text('title').notNull(),

    // Local dates, no time component -> ISO 'YYYY-MM-DD' strings.
    // Do NOT store these as instants; "the trip starts on the 3rd"
    // is a calendar fact, not a moment in time.
    startDate: text('start_date'),
    endDate: text('end_date'),

    // Currency everything gets normalised to for trip totals. ISO 4217.
    baseCurrency: text('base_currency').notNull().default('JPY'),

    coverImageUri: text('cover_image_uri'),
    notes: text('notes'),

    // Phase 2: server id of the owning account. Null while local-only.
    ownerUserId: text('owner_user_id'),
  },
  (t) => [index('trips_start_date_idx').on(t.startDate)],
);

export const tripsRelations = relations(trips, ({ many }) => ({
  people: many(people),
  places: many(places),
  items: many(items),
  expenses: many(expenses),
}));

export type Trip = typeof trips.$inferSelect;
export type NewTrip = typeof trips.$inferInsert;
