import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

export type TripTab = 'timeline' | 'places' | 'money' | 'you';

const ACTIVE = '#14161A';
const IDLE = '#8A8D95';

function Icon({ tab, color }: { tab: TripTab; color: string }) {
  const common = { stroke: color, strokeWidth: 1.9, strokeLinecap: 'round' as const, fill: 'none' };
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      {tab === 'timeline' ? <Path d="M4 6h16M4 12h16M4 18h10" {...common} /> : null}
      {tab === 'places' ? (
        <>
          <Path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z" {...common} strokeLinejoin="round" />
          <Circle cx={12} cy={10} r={2.4} {...common} />
        </>
      ) : null}
      {tab === 'money' ? <Path d="M3 7h18v12H3zM3 11h18" {...common} /> : null}
      {tab === 'you' ? (
        <>
          <Circle cx={12} cy={8.5} r={3.6} {...common} />
          <Path d="M5 20c0-3.6 3.1-5.5 7-5.5s7 1.9 7 5.5" {...common} />
        </>
      ) : null}
    </Svg>
  );
}

const TABS: { key: TripTab; label: string }[] = [
  { key: 'timeline', label: 'Timeline' },
  { key: 'places', label: 'Places' },
  { key: 'money', label: 'Money' },
  { key: 'you', label: 'You' },
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
