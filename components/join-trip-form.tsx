import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LandfallLogo } from '@/components/landfall-logo';
import { AvatarStack } from '@/components/ui/avatar-stack';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import type { InvitedTrip } from '@/db/queries/join';
import { formatTripDates } from '@/lib/date';
import { displayNameOf } from '@/lib/person';

/** What someone opening an invite link sees, once the trip has been resolved. */
export function JoinTripForm({
  trip,
  onJoin,
}: {
  trip: InvitedTrip;
  onJoin: (values: { name: string; email: string }) => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const canJoin = /\S+@\S+\.\S+/.test(email.trim());
  const submit = () => canJoin && onJoin({ name: name.trim(), email: email.trim() });
  const names = trip.people.map(displayNameOf);

  return (
    <SafeAreaView edges={['top', 'bottom']} className="bg-background flex-1">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerClassName="gap-6 px-6 pb-6 pt-8" keyboardShouldPersistTaps="handled">
          <View className="items-center gap-3">
            <LandfallLogo size={44} />
            <Text variant="monoSm">YOU&apos;RE INVITED TO</Text>
            <Text variant="display" className="text-center">
              {trip.title}
            </Text>
            <Text variant="bodySm" className="text-muted-foreground">
              {formatTripDates(trip.startDate, trip.endDate)}
            </Text>
            {names.length ? (
              <View className="mt-1 items-center gap-2">
                <AvatarStack names={names} size={34} ringClassName="border-background" />
                <Text variant="caption">
                  {names.length === 1 ? '1 person' : `${names.length} people`} already on this trip
                </Text>
              </View>
            ) : null}
          </View>

          <View className="gap-4">
            <View className="gap-[7px]">
              <Text variant="label">Email</Text>
              <Input
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                autoFocus
              />
            </View>

            <View className="gap-[7px]">
              <Text variant="label">Name · optional</Text>
              <Input
                value={name}
                onChangeText={setName}
                placeholder="What the others should see"
                returnKeyType="done"
                onSubmitEditing={submit}
              />
            </View>
          </View>

          <Button size="block" onPress={submit} disabled={!canJoin}>
            <Text>Join trip</Text>
          </Button>

          <Text variant="caption" className="text-center">
            Anyone on a trip can add items and log spend.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
