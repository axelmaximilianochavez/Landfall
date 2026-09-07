import { AntDesign } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';
import type { TripExpense } from '@/db/queries/trip';
import type { Person } from '@/db/schema';
import { toISODate } from '@/lib/date';
import {
  CATEGORY_COLOR,
  CATEGORY_LABEL,
  asCategory,
  formatMoney,
  toBaseMinor,
  type ExpenseCategory,
} from '@/lib/money';
import { displayNameOf } from '@/lib/person';
import { formatDayLabel } from '@/lib/timeline';
import { cn } from '@/lib/utils';

const ICON: Record<ExpenseCategory, React.ComponentProps<typeof AntDesign>['name']> = {
  food: 'rest',
  transit: 'right',
  stay: 'home',
  other: 'tag',
};

/** Category tints, at the low opacity the design uses for the icon tiles. */
const TILE: Record<ExpenseCategory, string> = {
  food: '#FFEDE6',
  transit: '#EAF2FC',
  stay: '#FBF0DC',
  other: '#F1EFE9',
};

type Filter = 'all' | ExpenseCategory | 'mine';

export function ExpenseList({
  expenses,
  people,
  baseCurrency,
  selfPersonId,
}: {
  expenses: TripExpense[];
  people: Person[];
  baseCurrency: string;
  selfPersonId?: string | null;
}) {
  const [filter, setFilter] = useState<Filter>('all');

  const nameOf = (personId: string) => {
    const person = people.find((p) => p.id === personId);
    if (!person) return 'Someone';
    return person.isSelf ? 'You' : displayNameOf(person);
  };

  const visible = expenses.filter((expense) => {
    if (filter === 'all') return true;
    if (filter === 'mine') return expense.paidByPersonId === selfPersonId;
    return asCategory(expense.category) === filter;
  });

  // Newest first, grouped by the day they were spent.
  const byDay = new Map<string, TripExpense[]>();
  for (const expense of [...visible].sort((a, b) => b.spentAt.getTime() - a.spentAt.getTime())) {
    const key = toISODate(expense.spentAt);
    const bucket = byDay.get(key);
    if (bucket) bucket.push(expense);
    else byDay.set(key, [expense]);
  }

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: `All · ${expenses.length}` },
    { key: 'transit', label: 'Transit' },
    { key: 'stay', label: 'Stay' },
    { key: 'food', label: 'Food' },
    { key: 'mine', label: 'You paid' },
  ];

  return (
    <View className="gap-3">
      <View className="flex-row flex-wrap gap-2">
        {filters.map((option) => {
          const on = option.key === filter;
          return (
            <Pressable
              key={option.key}
              onPress={() => setFilter(option.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              className={cn('rounded-full px-[15px] py-[9px]', on ? 'bg-primary' : 'bg-well')}
            >
              <Text
                className={cn(
                  'font-body-medium text-[13.5px]',
                  on ? 'text-primary-foreground' : 'text-muted-foreground'
                )}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {visible.length === 0 ? (
        <Text variant="bodySm" className="text-subtle py-4 text-center">
          Nothing matches that filter.
        </Text>
      ) : null}

      {[...byDay.entries()].map(([day, dayExpenses]) => {
        const dayTotal = dayExpenses.reduce(
          (sum, e) => sum + toBaseMinor(e.amountMinor, e.rateToBaseMicros),
          0
        );
        return (
          <View key={day} className="gap-2">
            <View className="flex-row items-baseline justify-between px-[2px]">
              <Text variant="mono" className="text-muted-foreground text-[11px]">
                {formatDayLabel(day)}
              </Text>
              <Text variant="mono" className="text-subtle text-[11px]">
                {formatMoney(dayTotal, baseCurrency)}
              </Text>
            </View>

            {dayExpenses.map((expense) => {
              const category = asCategory(expense.category);
              const mine = expense.shares.find((s) => s.personId === selfPersonId);
              const iPaid = expense.paidByPersonId === selfPersonId;
              const myShare = toBaseMinor(mine?.shareAmountMinor ?? 0, expense.rateToBaseMicros);
              const inBase = toBaseMinor(expense.amountMinor, expense.rateToBaseMicros);
              const owedToMe = iPaid ? inBase - myShare : 0;

              return (
                <View
                  key={expense.id}
                  className="bg-card flex-row items-center gap-3 rounded-lg p-[13px]"
                >
                  <View
                    className="h-[38px] w-[38px] items-center justify-center rounded-[12px]"
                    style={{ backgroundColor: TILE[category] }}
                  >
                    <AntDesign name={ICON[category]} size={16} color={CATEGORY_COLOR[category]} />
                  </View>

                  <View className="flex-1 gap-[2px]">
                    <Text variant="body" className="font-body-medium text-[14.5px]" numberOfLines={1}>
                      {expense.description}
                    </Text>
                    <Text variant="caption" numberOfLines={1}>
                      {nameOf(expense.paidByPersonId)} paid · splits {expense.shares.length}{' '}
                      {expense.shares.length === 1 ? 'way' : 'ways'}
                      {expense.currency !== baseCurrency
                        ? ` · ${formatMoney(expense.amountMinor, expense.currency)}`
                        : ''}
                    </Text>
                  </View>

                  <View className="items-end gap-[2px]">
                    <Text variant="metricSm" className="text-[16px]">
                      {formatMoney(inBase, baseCurrency)}
                    </Text>
                    {iPaid && owedToMe > 0 ? (
                      <Text variant="caption" className="text-settled-strong">
                        you&apos;re owed {formatMoney(owedToMe, baseCurrency)}
                      </Text>
                    ) : !iPaid && myShare > 0 ? (
                      <Text variant="caption" className="text-owed-strong">
                        you owe {formatMoney(myShare, baseCurrency)}
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

export { CATEGORY_LABEL };
