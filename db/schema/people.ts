import { relations } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { base } from './_base';
import { expenseShares } from './expense-shares';
import { expenses } from './expenses';
import { trips } from './trips';

/** Who is on the trip. */
export const people = sqliteTable(
  'people',
  {
    ...base(),
    tripId: text('trip_id')
      .notNull()
      .references(() => trips.id, { onDelete: 'cascade' }),

    displayName: text('display_name').notNull(),
    avatarUri: text('avatar_uri'),

    // Exactly one person per trip should be the device owner.
    isSelf: integer('is_self', { mode: 'boolean' }).notNull().default(false),

    // Phase 2: filled in once this person accepts an invite and has
    // a real account. Null means "a name I typed in, not a real user".
    userId: text('user_id'),
  },
  (t) => [index('people_trip_idx').on(t.tripId)],
);

export const peopleRelations = relations(people, ({ one, many }) => ({
  trip: one(trips, { fields: [people.tripId], references: [trips.id] }),
  expensesPaid: many(expenses),
  shares: many(expenseShares),
}));

export type Person = typeof people.$inferSelect;
export type NewPerson = typeof people.$inferInsert;
