import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import type { TripExpense } from '@/db/queries/trip';
import type { Segment } from '@/db/schema';
import { toISODate } from '@/lib/date';
import {
  CATEGORY_COLOR,
  CATEGORY_LABEL,
  categoryTotals,
  currencySymbol,
  formatMoney,
  toBaseMinor,
  tripTotals,
} from '@/lib/money';
import { isWithinSegment } from '@/lib/timeline';

/**
 * The dark instrument card at the top of Money.
 *
 * Every number is derived from the expense rows — nothing here is stored.
 */
export function MoneySummary({
  expenses,
  segments,
  baseCurrency,
  selfPersonId,
  peopleCount,
}: {
  expenses: TripExpense[];
  segments: Segment[];
  baseCurrency: string;
  selfPersonId?: string | null;
  peopleCount: number;
}) {
  const { totalMinor, yourShareMinor } = tripTotals(expenses, selfPersonId);
  const empty = expenses.length === 0;
  const categories = categoryTotals(expenses);
  const perPerson = peopleCount > 0 ? Math.round(totalMinor / peopleCount) : 0;

  // Spend per destination. Each expense counts once, against the FIRST leg its
  // date falls in — legs share a boundary day (Japan 12–15, Korea 15–16), so
  // summing them independently double-counts the travel day and the parts stop
  // adding up to the total.
  const perSegmentTotals = new Map<string, number>();
  for (const expense of expenses) {
    const day = toISODate(expense.spentAt);
    const leg = segments.find((segment) => isWithinSegment(day, segment));
    if (!leg) continue;
    const inBase = toBaseMinor(expense.amountMinor, expense.rateToBaseMicros);
    perSegmentTotals.set(leg.id, (perSegmentTotals.get(leg.id) ?? 0) + inBase);
  }
  const perSegment = segments
    .map((segment) => ({ segment, totalMinor: perSegmentTotals.get(segment.id) ?? 0 }))
    .filter((entry) => entry.totalMinor > 0);

  return (
    <View className="bg-foreground gap-3 rounded-2xl p-[18px]">
      <View className="flex-row items-end justify-between gap-4">
        <View className="gap-[6px]">
          <Text variant="monoSm" className="text-[#8A8D95]">
            TOTAL SPENT SO FAR
          </Text>
          <Text variant="metric" className="text-primary-foreground">
            {formatMoney(totalMinor, baseCurrency)}
          </Text>
        </View>
        <View className="items-end gap-[6px]">
          <Text variant="monoSm" className="text-[#8A8D95]">
            YOUR SHARE
          </Text>
          <Text variant="metricSm" className="text-primary-foreground">
            {formatMoney(yourShareMinor, baseCurrency)}
          </Text>
        </View>
      </View>

      {/* One segment per category, widths in proportion to spend. */}
      <View className="h-[6px] flex-row overflow-hidden rounded-full bg-[#FFFFFF1F]">
        {categories.map((entry) => (
          <View
            key={entry.category}
            style={{
              width: `${(entry.totalMinor / totalMinor) * 100}%`,
              backgroundColor: CATEGORY_COLOR[entry.category],
            }}
          />
        ))}
      </View>

      {empty ? (
        <Text variant="bodySm" className="leading-[19px] text-[#CFCBBE]">
          Nothing logged yet. Anything in another currency converts to{' '}
          {currencySymbol(baseCurrency)} at the rate on the day you log it.
        </Text>
      ) : (
        <View className="flex-row flex-wrap items-center gap-x-4 gap-y-1">
          {categories.map((entry) => (
            <View key={entry.category} className="flex-row items-center gap-[6px]">
              <View
                className="h-[7px] w-[7px] rounded-full"
                style={{ backgroundColor: CATEGORY_COLOR[entry.category] }}
              />
              <Text variant="bodySm" className="text-[#CFCBBE] text-[12.5px]">
                {CATEGORY_LABEL[entry.category]} {formatMoney(entry.totalMinor, baseCurrency)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {!empty ? (
        <>
          <View className="h-px bg-[#FFFFFF1F]" />
          <View className="flex-row justify-between gap-3">
            {perSegment.slice(0, 2).map((entry) => (
              <View key={entry.segment.id} className="gap-[4px]">
                <Text variant="monoSm" className="text-[#8A8D95]">
                  {entry.segment.name.toUpperCase()}
                </Text>
                <Text variant="metricSm" className="text-primary-foreground">
                  {formatMoney(entry.totalMinor, baseCurrency)}
                </Text>
              </View>
            ))}
            <View className="items-end gap-[4px]">
              <Text variant="monoSm" className="text-[#8A8D95]">
                PER PERSON
              </Text>
              <Text variant="metricSm" className="text-primary-foreground">
                {formatMoney(perPerson, baseCurrency)}
              </Text>
            </View>
          </View>
        </>
      ) : null}
    </View>
  );
}
