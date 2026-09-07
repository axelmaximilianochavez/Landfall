import { View } from 'react-native';

import { personColor } from '@/components/ui/avatar-stack';
import { Text } from '@/components/ui/text';
import type { TripExpense } from '@/db/queries/trip';
import type { Person } from '@/db/schema';
import { formatMoney, personBalances } from '@/lib/money';
import { displayNameOf, initialOfPerson } from '@/lib/person';
import { cn } from '@/lib/utils';

/**
 * Who is up and who is down. Positive means the trip owes them.
 *
 * The nets always sum to zero — that is the invariant worth remembering if
 * these numbers ever look wrong.
 */
export function BalancesCard({
  people,
  expenses,
  baseCurrency,
}: {
  people: Person[];
  expenses: TripExpense[];
  baseCurrency: string;
}) {
  const balances = personBalances(
    expenses,
    people.map((p) => p.id)
  );
  const total = balances.reduce((sum, b) => sum + b.paidMinor, 0);
  const each = people.length ? Math.round(total / people.length) : 0;

  return (
    <View className="bg-paper gap-1 rounded-xl p-4">
      <View className="flex-row items-baseline justify-between">
        <Text variant="monoSm" className="text-paper-foreground">
          SPLITTING WITH
        </Text>
        {total > 0 ? (
          <Text variant="monoSm" className="text-paper-foreground">
            {formatMoney(each, baseCurrency)} EACH
          </Text>
        ) : null}
      </View>

      {people.map((person, index) => {
        const balance = balances[index];
        const net = balance?.netMinor ?? 0;
        return (
          <View
            key={person.id}
            className={cn(
              'flex-row items-center gap-3 py-[11px]',
              index > 0 && 'border-border border-t'
            )}
          >
            <View
              className={cn(
                'h-[34px] w-[34px] items-center justify-center rounded-full',
                personColor(index)
              )}
            >
              <Text
                className={cn(
                  'font-body-semibold text-[13px]',
                  index === 0 ? 'text-primary-foreground' : 'text-white'
                )}
              >
                {initialOfPerson(person)}
              </Text>
            </View>

            <View className="flex-1 gap-[2px]">
              <Text variant="body" className="font-body-medium text-[15px]">
                {person.isSelf ? 'You' : displayNameOf(person)}
              </Text>
              <Text variant="caption">
                paid {formatMoney(balance?.paidMinor ?? 0, baseCurrency)}
              </Text>
            </View>

            <Text
              variant="metricSm"
              className={cn(
                'text-[16px]',
                net > 0 ? 'text-settled-strong' : net < 0 ? 'text-owed-strong' : 'text-muted-foreground'
              )}
            >
              {net > 0 ? '+' : net < 0 ? '−' : ''}
              {formatMoney(Math.abs(net), baseCurrency)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
