import { relations } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { base } from './_base';
import { expenseShares } from './expense-shares';
import { items } from './items';
import { people } from './people';
import { trips } from './trips';

export type SplitMode = 'equal' | 'exact' | 'shares';

export const expenses = sqliteTable(
  'expenses',
  {
    ...base(),
    tripId: text('trip_id')
      .notNull()
      .references(() => trips.id, { onDelete: 'cascade' }),

    description: text('description').notNull(),
    category: text('category'), // 'food' | 'transport' | 'lodging' | ...

    // MINOR UNITS, INTEGER. 1234 = ¥1234 = $12.34.
    // Never a float. 0.1 + 0.2 !== 0.3 and you cannot settle up
    // a trip with rounding drift in the balances.
    amountMinor: integer('amount_minor').notNull(),
    currency: text('currency').notNull(),

    // Rate used to convert to trips.baseCurrency, captured at entry
    // time and frozen. Stored * 1e6 as an integer.
    // If you look the rate up fresh on every render, last week's
    // dinner changes price every time you open the app.
    rateToBaseMicros: integer('rate_to_base_micros').notNull().default(1_000_000),

    // RESTRICT deliberately: you cannot remove someone who has paid for
    // something. Note this makes a one-statement trip delete impossible —
    // delete a trip's expenses first, in a transaction. See db/schema/index.ts.
    paidByPersonId: text('paid_by_person_id')
      .notNull()
      .references(() => people.id, { onDelete: 'restrict' }),

    splitMode: text('split_mode').$type<SplitMode>().notNull().default('equal'),

    spentAt: integer('spent_at', { mode: 'timestamp_ms' }).notNull(),

    // Optional link to the itinerary entry this belongs to, so a hotel
    // booking and its cost are the same thing in the UI.
    itemId: text('item_id').references(() => items.id, { onDelete: 'set null' }),

    receiptUri: text('receipt_uri'),
  },
  (t) => [
    index('expenses_trip_spent_idx').on(t.tripId, t.spentAt),
    index('expenses_payer_idx').on(t.paidByPersonId),
  ],
);

export const expensesRelations = relations(expenses, ({ one, many }) => ({
  trip: one(trips, { fields: [expenses.tripId], references: [trips.id] }),
  paidBy: one(people, {
    fields: [expenses.paidByPersonId],
    references: [people.id],
  }),
  item: one(items, { fields: [expenses.itemId], references: [items.id] }),
  shares: many(expenseShares),
}));

export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
