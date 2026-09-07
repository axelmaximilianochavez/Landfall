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

/**
 * The date a bounded picker should open on.
 *
 * Handing a native picker a value outside its own [min, max] is undefined
 * behaviour on Android, so the result is always clamped into range. With no
 * value yet it opens on `min` — that is what makes the picker land on the
 * month you are travelling instead of the current month.
 */
export function initialPickerDate(
  value: string | null,
  min: string | null,
  max: string | null,
  today: Date = new Date()
): Date {
  let date = value ? fromISODate(value) : min ? fromISODate(min) : today;
  if (min && date < fromISODate(min)) date = fromISODate(min);
  if (max && date > fromISODate(max)) date = fromISODate(max);
  return date;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** "just now", "3 hours ago", "2 days ago" — for invite timestamps. */
export function formatRelativeTime(date: Date, now: Date = new Date()): string {
  const diff = now.getTime() - date.getTime();
  if (diff < 0) return 'just now';
  if (diff < MINUTE) return 'just now';
  if (diff < HOUR) {
    const mins = Math.floor(diff / MINUTE);
    return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  }
  if (diff < DAY) {
    const hours = Math.floor(diff / HOUR);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  const days = Math.floor(diff / DAY);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? '' : 's'} ago`;
}

/** '2H 30M' — the gap between two instants, as the flight header shows it. */
export function formatDuration(fromDate: Date, toDate: Date): string | null {
  const ms = toDate.getTime() - fromDate.getTime();
  if (ms <= 0) return null;
  const totalMinutes = Math.round(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}M`;
  if (minutes === 0) return `${hours}H`;
  return `${hours}H ${minutes}M`;
}
