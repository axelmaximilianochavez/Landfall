import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { TimelineItemCard } from '@/components/timeline-item-card';
import { TripTabBar, type TripTab } from '@/components/trip-tab-bar';
import { AvatarStack } from '@/components/ui/avatar-stack';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useTrip } from '@/db/queries/trip';
import { formatTripDates } from '@/lib/date';
import { groupTimeline } from '@/lib/timeline';

function BackButton() {
  return (
    <Pressable
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/dashboard'))}
      accessibilityRole="button"
      accessibilityLabel="Back"
      className="bg-well h-[34px] w-[34px] items-center justify-center rounded-full active:opacity-70"
    >
      <Svg width={18} height={18} viewBox="0 0 24 24">
        <Path
          d="M15 5l-7 7 7 7"
          stroke="#14161A"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </Pressable>
  );
}

function Placeholder({ title, body }: { title: string; body: string }) {
  return (
    <View className="bg-card items-center gap-2 rounded-lg px-6 py-[34px]">
      <Text variant="title">{title}</Text>
      <Text variant="bodySm" className="text-muted-foreground max-w-[240px] text-center">
        {body}
      </Text>
    </View>
  );
}

export default function TripDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { trip, error } = useTrip(id);
  const [tab, setTab] = useState<TripTab>('timeline');

  if (error || !trip) {
    return (
      <SafeAreaView edges={['top']} className="bg-background flex-1 px-5 pt-6">
        <BackButton />
        <View className="flex-1 items-center justify-center">
          <Text variant="bodySm" className="text-muted-foreground text-center">
            {error ? error.message : 'This trip no longer exists.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const names = trip.people.map((p) => p.displayName);
  const groups = groupTimeline(trip.items, trip.segments);

  return (
    <View className="bg-background flex-1">
      <SafeAreaView edges={['top']} className="flex-1">
        <View className="border-border gap-[14px] border-b px-5 pb-3 pt-2">
          <View className="flex-row items-center gap-3">
            <BackButton />
            <View className="flex-1 gap-[2px]">
              <Text variant="h3">{trip.title}</Text>
              <Text variant="caption">
                {formatTripDates(trip.startDate, trip.endDate)} · totals in {trip.baseCurrency}
              </Text>
            </View>
            <AvatarStack names={names} size={28} ringClassName="border-background" />
          </View>

          {tab === 'timeline' && trip.segments.length ? (
            <View className="flex-row gap-2">
              {trip.segments.map((segment) => (
                <View key={segment.id} className="bg-card flex-1 gap-[3px] rounded-md px-[14px] py-[11px]">
                  <Text variant="subtitle" className="text-[14px] leading-[14px]">
                    {segment.name}
                  </Text>
                  <Text variant="monoSm">
                    {segment.startDate ? formatTripDates(segment.startDate, segment.endDate) : '—'}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        <ScrollView contentContainerClassName="px-5 pb-6 pt-[18px] gap-[22px]">
          {tab === 'timeline' ? (
            groups.length ? (
              groups.map((group) => (
                <View key={group.key} className="gap-[14px]">
                  {group.name ? (
                    <View className="border-foreground flex-row items-baseline justify-between border-b-[1.5px] pb-2">
                      <Text variant="title">{group.name}</Text>
                      <Text variant="mono" className="text-muted-foreground text-[11px]">
                        {group.meta}
                      </Text>
                    </View>
                  ) : null}
                  {group.days.length === 0 ? (
                    <Text variant="bodySm" className="text-subtle pl-[2px]">
                      Nothing planned in {group.name} yet.
                    </Text>
                  ) : null}
                  {group.days.map((day) => (
                    <View key={day.key} className="gap-2">
                      <Text variant="mono" className="text-foreground pl-[2px] text-[11px]">
                        {day.label}
                      </Text>
                      {day.items.map((item) => (
                        <TimelineItemCard key={item.id} item={item} />
                      ))}
                    </View>
                  ))}
                </View>
              ))
            ) : (
              <View className="bg-card items-center gap-3 rounded-lg px-6 py-[34px]">
                <Text variant="title">Nothing booked yet</Text>
                <Text
                  variant="bodySm"
                  className="text-muted-foreground max-w-[230px] text-center leading-[19px]"
                >
                  Add a flight, a stay or a place and it lands on the timeline in date order.
                </Text>
                <Button
                  className="mt-1 rounded-[12px] px-[22px] py-3"
                  onPress={() => router.push(`/trip/${trip.id}/add`)}
                >
                  <Text className="text-[14px]">Add first item</Text>
                </Button>
              </View>
            )
          ) : null}

          {tab === 'places' ? (
            <Placeholder
              title="Places"
              body="Saved places and the trip map land here next."
            />
          ) : null}

          {tab === 'money' ? (
            <Placeholder
              title="Money"
              body="Trip totals, per-person balances and Settle up land here next."
            />
          ) : null}

          {tab === 'you' ? (
            <View className="gap-4">
              <View className="bg-card flex-row items-center gap-[14px] rounded-2xl p-5">
                <AvatarStack names={names.slice(0, 1)} size={52} />
                <View className="gap-[3px]">
                  <Text variant="h3" className="text-[19px]">
                    {names[0] ?? 'You'}
                  </Text>
                  <Text variant="caption">{trip.people.length} on this trip</Text>
                </View>
              </View>
              <Placeholder
                title="Settings"
                body="Home currency, maps app and departure alerts land here next."
              />
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>

      {/* Floating add button, on every tab (design canvas 1b). */}
      {tab === 'timeline' ? (
        <Pressable
          onPress={() => router.push(`/trip/${trip.id}/add`)}
          accessibilityRole="button"
          accessibilityLabel="Add to trip"
          className="bg-primary absolute bottom-[92px] right-5 h-[52px] w-[52px] items-center justify-center rounded-full active:opacity-90"
          style={{ elevation: 4 }}
        >
          <Text className="text-primary-foreground text-[26px] leading-[30px]">+</Text>
        </Pressable>
      ) : null}

      <TripTabBar active={tab} onChange={setTab} />
    </View>
  );
}
