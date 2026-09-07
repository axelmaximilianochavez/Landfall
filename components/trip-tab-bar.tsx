import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

export type TripTab = 'timeline' | 'people' | 'money';

const ACTIVE = '#14161A';
const IDLE = '#8A8D95';

function Icon({ tab, color }: { tab: TripTab; color: string }) {
  const common = { stroke: color, strokeWidth: 1.9, strokeLinecap: 'round' as const, fill: 'none' };
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      {tab === 'timeline' ? <Path d="M4 6h16M4 12h16M4 18h10" {...common} /> : null}
      {tab === 'people' ? (
        <>
          <Circle cx={9.5} cy={8.5} r={3.3} {...common} />
          <Path d="M3.5 20c0-3.3 2.7-5.1 6-5.1s6 1.8 6 5.1" {...common} />
          <Path d="M16.2 5.6a3.3 3.3 0 0 1 0 5.8" {...common} />
          <Path d="M18 20c0-2.1-.5-3.7-1.5-4.8" {...common} />
        </>
      ) : null}
      {tab === 'money' ? <Path d="M3 7h18v12H3zM3 11h18" {...common} /> : null}
    </Svg>
  );
}

const TABS: { key: TripTab; label: string }[] = [
  { key: 'timeline', label: 'Timeline' },
  { key: 'people', label: 'People' },
  { key: 'money', label: 'Money' },
];

/** Bottom tabs for a single trip (design canvas 1c). */
export function TripTabBar({
  active,
  onChange,
}: {
  active: TripTab;
  onChange: (tab: TripTab) => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      className="border-border bg-background/95 flex-row border-t px-2 pt-[11px]"
      style={{ paddingBottom: Math.max(insets.bottom, 12) }}
    >
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            className="flex-1 items-center justify-center gap-[5px] active:opacity-60"
          >
            <Icon tab={tab.key} color={isActive ? ACTIVE : IDLE} />
            <Text
              className={cn(
                'text-[10.5px]',
                isActive ? 'font-body-semibold text-foreground' : 'font-body-medium text-subtle'
              )}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
