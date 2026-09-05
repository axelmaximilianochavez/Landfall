/**
 * Schema barrel. `db/index.ts` passes this whole module to drizzle(), so
 * every table AND its relations must be re-exported here or the relational
 * query builder (db.query.*) will not see them.
 *
 * Shared columns live in ./_base. One file per table; each table's relations
 * and inferred types are co-located with it.
 *
 * ---------------------------------------------------------------------------
 * NOT a table: settlements
 * ---------------------------------------------------------------------------
 * Deliberately absent. A person's balance is:
 *
 *   SUM(expenses.amount_minor * rate WHERE paid_by = p)
 * - SUM(expense_shares.share_amount_minor * rate WHERE person = p)
 *
 * Derive it. Storing balances means every edit to any expense has to
 * fan out and rewrite them, and any bug leaves you with numbers that
 * disagree with the underlying rows and no way to tell which is right.
 *
 * Add a `settlements` table only when you want to record actual
 * repayments ("Merlyn paid Axel ¥8000 on the 5th") — that IS a real
 * event worth persisting, unlike a computed balance.
 *
 * ---------------------------------------------------------------------------
 * Deleting a trip
 * ---------------------------------------------------------------------------
 * expenses.paid_by_person_id is ON DELETE RESTRICT, and trips cascade into
 * people, so `DELETE FROM trips` fails with FOREIGN KEY constraint failed
 * while any expense exists. Clear the expenses first, in a transaction:
 *
 *   await db.transaction(async (tx) => {
 *     await tx.delete(expenses).where(eq(expenses.tripId, id)); // -> shares
 *     await tx.delete(trips).where(eq(trips.id, id));           // -> rest
 *   });
 */

export * from './trips';
export * from './segments';
export * from './people';
export * from './places';
export * from './items';
export * from './item-people';
export * from './expenses';
export * from './expense-shares';
