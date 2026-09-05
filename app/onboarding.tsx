import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LandfallLogo } from '@/components/landfall-logo';
import { Text } from '@/components/ui/text';
import { useOnboardingSeen } from '@/lib/onboarding';
import { cn } from '@/lib/utils';

type Row = { color: string; text: string };
type Slide = { title: string; body: string; rows: Row[] };

/**
 * Three cards, shown once for a first-time user between signing in and the
 * trips list. Copy for the timeline card is verbatim from the design canvas;
 * the other two follow its voice.
 */
const SLIDES: Slide[] = [
  {
    title: 'One timeline, however many countries.',
    body: "Flights, trains, hotels and the places you saved, in the order you'll reach them. Every point opens in Maps in one tap.",
    rows: [
      { color: 'bg-transit', text: '10:45 · NRT → ICN' },
      { color: 'bg-stay', text: '16:00 · Nest Hotel' },
      { color: 'bg-place', text: '13:00 · Gwangjang Mkt' },
    ],
  },
  {
    title: 'Everyone on the trip, on the same page.',
    body: 'Invite the people coming with you. Anyone can add an item or log what they spent, and it shows up for the rest straight away.',
    rows: [
      { color: 'bg-primary-foreground', text: 'You · created the trip' },
      { color: 'bg-transit', text: 'Yuki · added 2 stays' },
      { color: 'bg-stay', text: 'Sam · logged ¥4,200' },
    ],
  },
  {
    title: 'Split as you go, settle once.',
    body: 'Log spend in whatever currency you paid in. Landfall tracks who owes whom and clears the whole trip in as few transfers as possible.',
    rows: [
      { color: 'bg-settled', text: 'Trip total · $990.40' },
      { color: 'bg-transit', text: 'Your share · $339.80' },
      { color: 'bg-place', text: 'Settle up · 2 transfers' },
    ],
  },
];

export default function Onboarding() {
  const { width } = useWindowDimensions();
  const scroller = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const { markSeen } = useOnboardingSeen();

  const finish = async () => {
    await markSeen();
    router.replace('/dashboard');
  };

  const next = () => {
    if (index >= SLIDES.length - 1) {
      void finish();
      return;
    }
    const target = index + 1;
    setIndex(target);
    scroller.current?.scrollTo({ x: target * width, animated: true });
  };

  return (
    <View className="flex-1 bg-foreground">
      <StatusBar style="light" />
      <SafeAreaView edges={['top', 'bottom']} className="flex-1">
        <View className="flex-row items-center justify-between px-6 pt-6">
          <LandfallLogo size={34} tone="bone" />
          <Pressable onPress={finish} accessibilityRole="button" hitSlop={12}>
            <Text className="font-body-medium text-[14px] text-[#CFCBBE]">Skip</Text>
          </Pressable>
        </View>

        <ScrollView
          ref={scroller}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) =>
            setIndex(Math.round(e.nativeEvent.contentOffset.x / width))
          }
          className="flex-1"
        >
          {SLIDES.map((slide) => (
            <View key={slide.title} style={{ width }} className="gap-7 px-6 pt-8">
              <View className="gap-[14px]">
                <Text
                  variant="display"
                  className="text-[38px] leading-[40px] tracking-[-1.14px] text-primary-foreground"
                >
                  {slide.title}
                </Text>
                <Text variant="body" className="text-[15px] leading-[23px] text-[#CFCBBE]">
                  {slide.body}
                </Text>
              </View>

              <View className="gap-3 rounded-2xl bg-[#F7F5EE12] p-4">
                {slide.rows.map((row) => (
                  <View key={row.text} className="flex-row items-center gap-3">
                    <View className={cn('h-2 w-2 rounded-full', row.color)} />
                    <Text variant="mono" className="text-primary-foreground text-[13px]">
                      {row.text}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>

        <View className="gap-5 px-6 pb-6">
          <View className="flex-row justify-center gap-[6px]">
            {SLIDES.map((slide, i) => (
              <View
                key={slide.title}
                className={cn(
                  'h-[7px] rounded-full',
                  i === index ? 'bg-primary-foreground w-[22px]' : 'w-[7px] bg-[#F7F5EE4D]'
                )}
              />
            ))}
          </View>
          <Pressable
            onPress={next}
            accessibilityRole="button"
            className="bg-primary-foreground items-center rounded-md py-[17px] active:opacity-90"
          >
            <Text className="font-body-semibold text-foreground text-[16px]">
              {index === SLIDES.length - 1 ? 'Get started' : 'Continue'}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
