import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

/** Person chip colours from the design canvas: ink, transit, stay, then repeat. */
const COLORS = ['bg-primary', 'bg-transit', 'bg-stay'] as const;

export function personColor(index: number) {
  return COLORS[index % COLORS.length];
}

export function initialOf(name: string) {
  return (name.trim()[0] ?? '?').toUpperCase();
}

/**
 * Overlapping initials, as on the trip card (design canvas 1c).
 * `ringClassName` should match the surface behind it so the ring reads as a cut-out.
 */
export function AvatarStack({
  names,
  size = 32,
  ringClassName = 'border-card',
}: {
  names: string[];
  size?: number;
  ringClassName?: string;
}) {
  return (
    <View className="flex-row">
      {names.map((name, i) => (
        <View
          key={`${name}-${i}`}
          style={{ width: size, height: size, marginLeft: i === 0 ? 0 : -(size * 0.28) }}
          className={cn(
            'items-center justify-center rounded-full border-2',
            personColor(i),
            ringClassName
          )}
        >
          <Text
            className={cn(
              'font-body-semibold',
              i === 0 ? 'text-primary-foreground' : 'text-white'
            )}
            style={{ fontSize: size * 0.375 }}
          >
            {initialOf(name)}
          </Text>
        </View>
      ))}
    </View>
  );
}
