import { relations } from 'drizzle-orm';
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

import { base } from './_base';
import { expenses } from './expenses';
import { people } from './people';

/**
 * Who owes what on each expense. One row per person per expense,
 * written at save time, not derived at read time.
 *
 * Why store the resolved amounts: an equal split of ¥1000 across 3
 * people is 334/333/333, and *someone* has to eat the extra yen. If
 * you recompute on read, the person eating it can change between
 * renders and the balances stop tying out. Resolve once, store it,
 * and the numbers are stable forever.
 */
export const expenseShares = sqliteTable(
  'expense_shares',
  {
    ...base(),
    expenseId: text('expense_id')
      .notNull()
      .references(() => expenses.id, { onDelete: 'cascade' }),
    personId: text('person_id')
      .notNull()
      .references(() => people.id, { onDelete: 'cascade' }),

    // Resolved owed amount, in the expense's currency, minor units.
    // SUM(share_amount_minor) per expense MUST equal expenses.amountMinor.
    shareAmountMinor: integer('share_amount_minor').notNull(),

    // Only meaningful when splitMode = 'shares' (e.g. 2 for a couple
    // sharing a room). Kept so the split can be re-opened and edited.
    shareUnits: integer('share_units').notNull().default(1),
  },
  (t) => [
    uniqueIndex('expense_shares_unique').on(t.expenseId, t.personId),
    index('expense_shares_person_idx').on(t.personId),
  ],
);

export const expenseSharesRelations = relations(expenseShares, ({ one }) => ({
  expense: one(expenses, {
    fields: [expenseShares.expenseId],
    references: [expenses.id],
  }),
  person: one(people, {
    fields: [expenseShares.personId],
    references: [people.id],
  }),
}));

export type ExpenseShare = typeof expenseShares.$inferSelect;
export type NewExpenseShare = typeof expenseShares.$inferInsert;
