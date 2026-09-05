import type { TimelineItem } from '@/db/queries/trip';
import type { Segment } from '@/db/schema';

import { toISODate } from './date';

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export type DayGroup = { key: string; label: string; items: TimelineItem[] };
export type TimelineGroup = { key: string; name: string | null; meta: string; days: DayGroup[] };

/** 'SAT 12 OCT' — the day heading in the design's timeline. */
export function formatDayLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  return `${DAYS[date.getDay()]} ${d} ${MONTHS[(m ?? 1) - 1]}`;
}

/** '10:45', or '—' for an item with no clock time. */
export function formatItemTime(item: TimelineItem): string {
  if (!item.startAt || item.isAllDay) return '—';
  const h = String(item.startAt.getHours()).padStart(2, '0');
  const min = String(item.startAt.getMinutes()).padStart(2, '0');
  return `${h}:${min}`;
}

function withinSegment(day: string, segment: Segment): boolean {
  if (!segment.startDate && !segment.endDate) return false;
  if (segment.startDate && day < segment.startDate) return false;
  if (segment.endDate && day > segment.endDate) return false;
  return true;
}

function toDays(items: TimelineItem[]): DayGroup[] {
  const byDay = new Map<string, TimelineItem[]>();
  for (const item of items) {
    const key = item.startAt ? toISODate(item.startAt) : 'unscheduled';
    const bucket = byDay.get(key);
    if (bucket) bucket.push(item);
    else byDay.set(key, [item]);
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => (a === 'unscheduled' ? 1 : b === 'unscheduled' ? -1 : a.localeCompare(b)))
    .map(([key, dayItems]) => ({
      key,
      label: key === 'unscheduled' ? 'NO DATE YET' : formatDayLabel(key),
      items: dayItems,
    }));
}

/**
 * Groups timeline items under their country leg, then by day.
 *
 * Membership is decided by comparing an item's date to each segment's range,
 * rather than by a stored FK — the date already answers the question, and a FK
 * would let the two disagree after an edit.
 */
export function groupTimeline(items: TimelineItem[], segments: Segment[]): TimelineGroup[] {
  const remaining = new Set(items);
  const groups: TimelineGroup[] = [];

  for (const segment of segments) {
    const mine: TimelineItem[] = [];
    for (const item of remaining) {
      if (!item.startAt) continue;
      if (withinSegment(toISODate(item.startAt), segment)) mine.push(item);
    }
    mine.forEach((item) => remaining.delete(item));

    const range =
      segment.startDate && segment.endDate
        ? `${formatDayLabel(segment.startDate).slice(4)}–${formatDayLabel(segment.endDate).slice(4)}`
        : '';
    const count = mine.length === 1 ? '1 item' : `${mine.length} items`;


    groups.push({
      key: segment.id,
      name: segment.name,
      meta: [range, count].filter(Boolean).join(' · '),
      days: toDays(mine),
    });
  }

  const leftovers = [...remaining];
  if (leftovers.length) {
    groups.push({
      key: '__ungrouped',
      // No header when there are no segments at all — the days stand alone.
      name: segments.length ? 'Not in a country leg' : null,
      meta: '',
      days: toDays(leftovers),
    });
  }

  // Declared legs are kept even when empty: "the timeline builds around them",
  // so a country you have not planned yet still has to show up and say so.
  return groups;
}
