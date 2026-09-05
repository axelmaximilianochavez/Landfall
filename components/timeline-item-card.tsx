import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import type { TimelineItem } from '@/db/queries/trip';
import type { ItemKind } from '@/db/schema';
import { cn } from '@/lib/utils';
import { formatItemTime } from '@/lib/timeline';

/**
 * Colour carries meaning (design canvas 1a): blue is something you catch,
 * amber is somewhere you sleep, orange is somewhere you chose to go.
 * One accent per row, never two.
 */
const KIND: Record<ItemKind, { label: string; dot: string; text: string; card: string }> = {
  flight: { label: 'FLIGHT', dot: 'bg-transit', text: 'text-transit', card: 'bg-card' },
  transport: { label: 'TRANSPORT', dot: 'bg-transit', text: 'text-transit', card: 'bg-card' },
  lodging: { label: 'CHECK IN', dot: 'bg-stay', text: 'text-stay', card: 'bg-card' },
  activity: { label: 'PLACE', dot: 'bg-place', text: 'text-place', card: 'bg-paper' },
};

export function TimelineItemCard({ item }: { item: TimelineItem }) {
  const kind = KIND[item.kind];
  const details = item.details;
  const tag =
    details?.kind === 'flight'
      ? [details.airline, details.flightNumber].filter(Boolean).join(' ')
      : details?.kind === 'transport'
        ? (details.operator ?? '')
        : '';

  const subtitle =
    item.fromPlace && item.toPlace
      ? `${item.fromPlace.name} → ${item.toPlace.name}`
      : (item.fromPlace?.address ?? item.fromPlace?.name ?? item.notes ?? '');

  return (
    <View className="flex-row items-stretch gap-3">
      <View className="w-11 pt-[15px]">
        <Text variant="mono" className="text-muted-foreground text-right text-[12px]">
          {formatItemTime(item)}
        </Text>
      </View>

      {/* The rail, with one dot per item in the item's own colour. */}
      <View className="bg-border w-[2px] rounded-full">
        <View className={cn('absolute -left-1 top-[17px] h-[10px] w-[10px] rounded-full', kind.dot)} />
      </View>

      <View className={cn('flex-1 gap-[5px] rounded-lg p-[14px]', kind.card)}>
        <View className="flex-row items-center gap-2">
          <Text variant="monoSm" className={kind.text}>
            {kind.label}
          </Text>
          {tag ? <Text variant="monoSm">{tag.toUpperCase()}</Text> : null}
        </View>
        <Text variant="subtitle">{item.title}</Text>
        {subtitle ? (
          <Text variant="bodySm" className="text-muted-foreground text-[12.5px]">
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
