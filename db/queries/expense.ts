import { eq } from 'drizzle-orm';

import { newId } from '@/lib/id';
import { splitEqually } from '@/lib/split';

import { db } from '../client';
import { expenseShares, expenses } from '../schema';

export type NewExpenseInput = {
  tripId: string;
  description: string;
  category: string;
  /** Integer minor units, in `currency`. */
  amountMinor: number;
  currency: string;
  paidByPersonId: string;
  spentAt: Date;
  /** Who the expense covers. The split is resolved now and stored. */
  coveredPersonIds: string[];
  /** Frozen conversion into the trip's base currency. */
  rateToBaseMicros?: number;
  itemId?: string | null;
};

/**
 * Writes an expense and its resolved shares in one transaction.
 *
 * The shares are computed here, once, rather than derived at read time — an
 * equal split leaves a remainder and somebody has to carry it, so it must be
 * decided and stored or the balances shift between renders.
 */
export function createExpense({
  tripId,
  description,
  category,
  amountMinor,
  currency,
  paidByPersonId,
  spentAt,
  coveredPersonIds,
  rateToBaseMicros = 1_000_000,
  itemId = null,
}: NewExpenseInput): string {
  const expenseId = newId();
  const shares = splitEqually(amountMinor, coveredPersonIds);

  db.transaction((tx) => {
    tx.insert(expenses)
      .values({
        id: expenseId,
        tripId,
        description,
        category,
        amountMinor,
        currency,
        rateToBaseMicros,
        paidByPersonId,
        splitMode: 'equal',
        spentAt,
        itemId,
      })
      .run();

    for (const share of shares) {
      tx.insert(expenseShares)
        .values({
          id: newId(),
          expenseId,
          personId: share.personId,
          shareAmountMinor: share.shareAmountMinor,
        })
        .run();
    }
  });

  return expenseId;
}

/** Soft-deletes an expense, so a future sync can propagate the removal. */
export function deleteExpense(expenseId: string): void {
  db.update(expenses).set({ deletedAt: new Date() }).where(eq(expenses.id, expenseId)).run();
}
