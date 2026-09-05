import { router } from 'expo-router';
import { FlatList, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AvatarStack } from '@/components/ui/avatar-stack';
import { Button } from '@/components/ui/button';
import { LandfallLogo } from '@/components/landfall-logo';
import { Text } from '@/components/ui/text';
import { useTrips, type TripWithPeople } from '@/db/queries/trips';
import { daysUntil, formatTripDates } from '@/lib/date';

function TripCard({ trip }: { trip: TripWithPeople }) {
  const countdown = daysUntil(trip.startDate);
  const names = trip.people.map((p) => p.displayName);

  return (
    <Pressable
      onPress={() => router.push(`/trip/${trip.id}`)}
      accessibilityRole="button"
      className="bg-card gap-4 rounded-3xl p-[18px] active:opacity-90"
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-[5px]">
          {countdown !== null ? (
            <Text variant="monoSm" className="text-place">
              {countdown === 1 ? 'STARTS TOMORROW' : `STARTS IN ${countdown} DAYS`}
            </Text>
          ) : null}
          <Text variant="h2">{trip.title}</Text>
          <Text variant="bodySm" className="text-muted-foreground">
            {formatTripDates(trip.startDate, trip.endDate)}
            {names.length > 1 ? ` · ${names.length} people` : ''}
          </Text>
        </View>
        <AvatarStack names={names} size={32} />
      </View>
    </Pressable>
  );
}

export default function Dashboard() {
  const { data: trips, error } = useTrips();

  return (
    <SafeAreaView edges={['top']} className="bg-background flex-1">
      <FlatList
        data={trips}
        keyExtractor={(trip) => trip.id}
        contentContainerClassName="gap-[18px] px-5 pb-7 pt-6"
        ListHeaderComponent={
          <View className="mb-[18px] flex-row items-center justify-between gap-4">
            <Text variant="display">Your trips</Text>
            <Button size="sm" className="rounded-[12px]" onPress={() => router.push('/trip/new')}>
              <Text className="text-[14px]">New trip</Text>
            </Button>
          </View>
        }
        ListEmptyComponent={
          error ? (
            <View className="bg-card items-center gap-3 rounded-lg p-8">
              <Text variant="title">Something went wrong</Text>
              <Text variant="bodySm" className="text-muted-foreground text-center">
                {error.message}
              </Text>
            </View>
          ) : (
            // Empty state from the design canvas (artboard 1b).
            <View className="bg-card items-center gap-3 rounded-lg px-6 py-[34px]">
              <View className="opacity-35">
                <LandfallLogo size={40} />
              </View>
              <Text variant="title">Nothing booked yet</Text>
              <Text
                variant="bodySm"
                className="text-muted-foreground max-w-[220px] text-center leading-[19px]"
              >
                Add a flight, a hotel or a place and it lands on the timeline in date order.
              </Text>
              <Button
                className="mt-1 rounded-[12px] px-[22px] py-3"
                onPress={() => router.push('/trip/new')}
              >
                <Text className="text-[14px]">Create your first trip</Text>
              </Button>
            </View>
          )
        }
        renderItem={({ item }) => <TripCard trip={item} />}
      />
    </SafeAreaView>
  );
}
