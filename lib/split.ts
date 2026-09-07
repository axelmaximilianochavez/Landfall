/**
 * Splitting an amount between people.
 *
 * An equal split of ¥1000 across 3 is 334/333/333 — someone has to eat the
 * extra yen. The shares are resolved once here and then STORED, so the person
 * eating it never changes between renders and the balances always tie out.
 * See db/schema/expense-shares.ts.
 */

export type Share = { personId: string; shareAmountMinor: number };

/**
 * Splits `amountMinor` as evenly as possible, giving the remainder to the
 * earliest people in the list. Guarantees the shares sum to exactly the amount.
 */
export function splitEqually(amountMinor: number, personIds: string[]): Share[] {
  if (personIds.length === 0) return [];

  const negative = amountMinor < 0;
  const abs = Math.abs(amountMinor);
  const base = Math.floor(abs / personIds.length);
  const remainder = abs - base * personIds.length;

  return personIds.map((personId, index) => {
    const amount = base + (index < remainder ? 1 : 0);
    return { personId, shareAmountMinor: negative ? -amount : amount };
  });
}

/** What each person pays on an even split, for the "$3.33 EACH" hint. */
export function evenShareMinor(amountMinor: number, count: number): number {
  if (count <= 0) return 0;
  return Math.floor(Math.abs(amountMinor) / count) * Math.sign(amountMinor || 1);
}
