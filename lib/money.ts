/**
 * Money is stored in MINOR UNITS as integers (db/schema/expenses.ts):
 * 1234 = ¥1234 = $12.34. Never floats — you cannot settle up a trip with
 * rounding drift in the balances.
 */

/** Currencies with no minor unit, where 1234 means 1234 and not 12.34. */
const ZERO_DECIMAL = new Set(['JPY', 'KRW', 'VND', 'CLP', 'ISK', 'HUF', 'TWD', 'UGX']);

const SYMBOLS: Record<string, string> = {
  JPY: '¥',
  KRW: '₩',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'CHF',
  CNY: '¥',
  THB: '฿',
  SGD: 'S$',
  MXN: 'MX$',
  BRL: 'R$',
  INR: '₹',
};

export function currencySymbol(code: string): string {
  return SYMBOLS[code.toUpperCase()] ?? code.toUpperCase();
}

export function decimalsFor(code: string): 0 | 2 {
  return ZERO_DECIMAL.has(code.toUpperCase()) ? 0 : 2;
}

/** '¥1,480' or '$12.34', from an integer minor amount. */
export function formatMoney(amountMinor: number, code: string): string {
  const decimals = decimalsFor(code);
  const negative = amountMinor < 0;
  const abs = Math.abs(amountMinor);
  const whole = decimals === 0 ? abs : Math.floor(abs / 100);
  const cents = decimals === 0 ? '' : `.${String(abs % 100).padStart(2, '0')}`;
  const grouped = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${negative ? '-' : ''}${currencySymbol(code)}${grouped}${cents}`;
}

/**
 * Converts a minor amount into the trip's base currency.
 *
 * The rate is the one frozen on the expense when it was logged, not today's —
 * otherwise last week's dinner changes price every time you open the app.
 */
export function toBaseMinor(amountMinor: number, rateToBaseMicros: number): number {
  return Math.round((amountMinor * rateToBaseMicros) / 1_000_000);
}

export type ExpenseLike = {
  amountMinor: number;
  rateToBaseMicros: number;
  shares: { personId: string; shareAmountMinor: number }[];
};

export type TripTotals = {
  /** Everything spent, in the trip's base currency, minor units. */
  totalMinor: number;
  /** What the given person owes of it, in base currency, minor units. */
  yourShareMinor: number;
};

/**
 * Trip totals, derived from the expenses rather than stored.
 *
 * Storing a running balance means every edit has to fan out and rewrite it,
 * and any bug leaves numbers that disagree with the rows they came from —
 * see the note in db/schema/index.ts.
 */
export function tripTotals(expenses: ExpenseLike[], selfPersonId?: string | null): TripTotals {
  let totalMinor = 0;
  let yourShareMinor = 0;

  for (const expense of expenses) {
    totalMinor += toBaseMinor(expense.amountMinor, expense.rateToBaseMicros);
    if (!selfPersonId) continue;
    for (const share of expense.shares) {
      if (share.personId === selfPersonId) {
        yourShareMinor += toBaseMinor(share.shareAmountMinor, expense.rateToBaseMicros);
      }
    }
  }

  return { totalMinor, yourShareMinor };
}

export type ExpenseCategory = 'transit' | 'stay' | 'food' | 'other';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = ['food', 'transit', 'stay', 'other'];

export const CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  food: 'Food',
  transit: 'Transit',
  stay: 'Stay',
  other: 'Other',
};

/** Colour carries meaning, one accent per category (design canvas 1a). */
export const CATEGORY_COLOR: Record<ExpenseCategory, string> = {
  transit: '#4A8EE0',
  stay: '#D68A12',
  food: '#FF6A3D',
  other: '#8A8D95',
};

export function asCategory(value: string | null): ExpenseCategory {
  return value === 'transit' || value === 'stay' || value === 'food' ? value : 'other';
}

export type PaidExpense = ExpenseLike & { paidByPersonId: string; category: string | null };

export type PersonBalance = {
  personId: string;
  /** What they put in, in base currency. */
  paidMinor: number;
  /** What they owe of the total, in base currency. */
  shareMinor: number;
  /** paid − share. Positive means the trip owes them. */
  netMinor: number;
};

/**
 * Per-person balances, derived from the rows.
 *
 * Deliberately not stored: every edit to any expense would have to fan out and
 * rewrite them, and any bug leaves numbers that disagree with the underlying
 * rows with no way to tell which is right.
 */
export function personBalances(expenses: PaidExpense[], personIds: string[]): PersonBalance[] {
  const paid = new Map<string, number>();
  const share = new Map<string, number>();

  for (const expense of expenses) {
    const inBase = toBaseMinor(expense.amountMinor, expense.rateToBaseMicros);
    paid.set(expense.paidByPersonId, (paid.get(expense.paidByPersonId) ?? 0) + inBase);
    for (const s of expense.shares) {
      const owed = toBaseMinor(s.shareAmountMinor, expense.rateToBaseMicros);
      share.set(s.personId, (share.get(s.personId) ?? 0) + owed);
    }
  }

  return personIds.map((personId) => {
    const paidMinor = paid.get(personId) ?? 0;
    const shareMinor = share.get(personId) ?? 0;
    return { personId, paidMinor, shareMinor, netMinor: paidMinor - shareMinor };
  });
}

/** Totals per category, biggest first, for the stacked bar and its legend. */
export function categoryTotals(
  expenses: PaidExpense[]
): { category: ExpenseCategory; totalMinor: number }[] {
  const totals = new Map<ExpenseCategory, number>();
  for (const expense of expenses) {
    const key = asCategory(expense.category);
    totals.set(key, (totals.get(key) ?? 0) + toBaseMinor(expense.amountMinor, expense.rateToBaseMicros));
  }
  return [...totals.entries()]
    .map(([category, totalMinor]) => ({ category, totalMinor }))
    .filter((entry) => entry.totalMinor !== 0)
    .sort((a, b) => b.totalMinor - a.totalMinor);
}

/**
 * Parses typed text into integer minor units for a currency.
 *
 * Returns null for anything that is not a usable amount, so callers can keep
 * the save button disabled rather than storing a NaN.
 */
export function parseAmountToMinor(text: string, code: string): number | null {
  const cleaned = text.replace(/[\s,]/g, '');
  if (!cleaned) return null;
  if (!/^\d*(\.\d*)?$/.test(cleaned)) return null;

  const decimals = decimalsFor(code);
  const [whole = '', fraction = ''] = cleaned.split('.');
  if (decimals === 0) {
    // Typing "1480.7" into a yen field is a slip, not 1480.7 yen.
    const value = Number(whole || '0');
    return Number.isFinite(value) ? Math.round(value) : null;
  }

  const padded = (fraction + '00').slice(0, 2);
  const value = Number(whole || '0') * 100 + Number(padded || '0');
  return Number.isFinite(value) ? value : null;
}

/** Groups the integer part with commas: '1234556' -> '1,234,556'. */
export function groupDigits(value: string): string {
  const [whole = '', fraction] = value.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return fraction === undefined ? grouped : `${grouped}.${fraction}`;
}

/**
 * Cleans typed input down to a usable amount.
 *
 * Returns null when the result would exceed `maxDigits`, so the caller can
 * reject the keystroke rather than truncate — silently shortening a pasted
 * number turns it into a different, plausible-looking amount.
 */
export function sanitizeAmountInput(
  text: string,
  code: string,
  maxDigits: number
): string | null {
  const decimals = decimalsFor(code);
  let cleaned = text.replace(/[^\d.]/g, '');

  if (decimals === 0) {
    cleaned = cleaned.replace(/\./g, '');
  } else {
    const firstDot = cleaned.indexOf('.');
    if (firstDot !== -1) {
      const whole = cleaned.slice(0, firstDot);
      const fraction = cleaned.slice(firstDot + 1).replace(/\./g, '').slice(0, decimals);
      cleaned = `${whole}.${fraction}`;
    }
  }

  if ((cleaned.match(/\d/g)?.length ?? 0) > maxDigits) return null;
  return cleaned;
}
