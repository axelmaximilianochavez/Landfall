import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

/** The well-filled pill switcher from the design canvas (artboard 1b). */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View className="bg-well flex-row gap-[6px] rounded-full p-[5px]">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            className={cn(
              'flex-1 items-center rounded-full px-4 py-[9px]',
              active ? 'bg-card' : 'active:opacity-70'
            )}
          >
            <Text
              className={cn(
                'text-[13px]',
                active ? 'font-body-semibold text-foreground' : 'font-body-medium text-muted-foreground'
              )}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
