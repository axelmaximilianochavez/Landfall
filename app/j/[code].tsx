import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { JoinTripForm } from '@/components/join-trip-form';
import { LandfallLogo } from '@/components/landfall-logo';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { isDatabaseAvailable } from '@/db';
import { joinTrip, useTripByInviteCode } from '@/db/queries/join';

/**
 * Where an invite link lands: landfall.app/j/<code>.
 *
 * The code resolves against trips already on this device, so it only works
 * while testing on the phone that created the trip. A real invite is opened by
 * someone who has never seen the trip — that needs the server to hand the trip
 * over before this screen can show anything.
 */
export default function JoinTrip() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { trip, loading } = useTripByInviteCode(code ?? '');

  if (loading && isDatabaseAvailable) {
    return (
      <SafeAreaView className="bg-background flex-1 items-center justify-center">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (!trip) {
    return (
      <SafeAreaView className="bg-background flex-1 items-center justify-center gap-3 px-8">
        <View className="opacity-35">
          <LandfallLogo size={44} />
        </View>
        <Text variant="h3" className="text-center">
          This invite can&apos;t be opened yet
        </Text>
        <Text variant="bodySm" className="text-muted-foreground text-center">
          Landfall needs to fetch the trip from the server before someone new can join, and that
          isn&apos;t built yet. The code was {code}.
        </Text>
        <Button variant="outline" size="sm" className="mt-2" onPress={() => router.replace('/')}>
          <Text>Back to Landfall</Text>
        </Button>
      </SafeAreaView>
    );
  }

  return (
    <JoinTripForm
      trip={trip}
      onJoin={({ name, email }) => {
        joinTrip({ tripId: trip.id, name: name || email, email });
        router.replace(`/trip/${trip.id}`);
      }}
    />
  );
}
