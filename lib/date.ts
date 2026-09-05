const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Formats a 'YYYY-MM-DD' calendar string.
 *
 * Deliberately does not go through `new Date(iso)`: that parses a bare date as
 * UTC midnight, so in any negative-offset timezone it renders the day before.
 * Trip dates are calendar facts, not instants — see db/schema/trips.ts.
 */
function formatDay(iso: string, withYear: boolean): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${MONTHS[m - 1]} ${d}${withYear ? `, ${y}` : ''}`;
}

export function formatTripDates(startDate: string | null, endDate: string | null): string {
  if (!startDate && !endDate) return 'No dates set';
  if (startDate && !endDate) return `From ${formatDay(startDate, true)}`;
  if (!startDate && endDate) return `Until ${formatDay(endDate, true)}`;

  const sameYear = startDate!.slice(0, 4) === endDate!.slice(0, 4);
  return `${formatDay(startDate!, !sameYear)} – ${formatDay(endDate!, true)}`;
}

/** Local calendar date as 'YYYY-MM-DD'. Not toISOString() — that shifts to UTC. */
export function toISODate(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

/** Parses 'YYYY-MM-DD' as a local date, avoiding the same UTC shift. */
export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Whole days from today until `iso`, or null when it is not in the future. */
export function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((fromISODate(iso).getTime() - today.getTime()) / 86_400_000);
  return diff > 0 ? diff : null;
}
