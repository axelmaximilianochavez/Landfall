import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { DateField } from '@/components/ui/date-field';
import { Input } from '@/components/ui/input';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Text } from '@/components/ui/text';
import { initialOf, personColor } from '@/components/ui/avatar-stack';
import { createItem, useTrip } from '@/db/queries/trip';
import type { ItemDetails, ItemKind } from '@/db/schema';
import { fromISODate } from '@/lib/date';
import { cn } from '@/lib/utils';

type Kind = 'flight' | 'train' | 'stay' | 'place';

const KIND_OPTIONS: { value: Kind; label: string }[] = [
  { value: 'flight', label: 'Flight' },
  { value: 'train', label: 'Train' },
  { value: 'stay', label: 'Stay' },
  { value: 'place', label: 'Place' },
];

const TITLES: Record<Kind, string> = {
  flight: 'Add flight',
  train: 'Add train',
  stay: 'Add stay',
  place: 'Add place',
};

/** Maps the picker to the four ItemKinds the schema stores. */
const ITEM_KIND: Record<Kind, ItemKind> = {
  flight: 'flight',
  train: 'transport',
  stay: 'lodging',
  place: 'activity',
};

export default function AddItem() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { trip } = useTrip(id);

  const [kind, setKind] = useState<Kind>('flight');
  const [code, setCode] = useState(''); // flight number / operator
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [name, setName] = useState(''); // stay / place name
  const [seat, setSeat] = useState('');
  const [address, setAddress] = useState('');
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [riders, setRiders] = useState<string[] | null>(null);

  const isTransit = kind === 'flight' || kind === 'train';
  const people = trip?.people ?? [];
  const selected = riders ?? people.map((p) => p.id); // default: everyone

  const title = isTransit
    ? from && to
      ? `${from.trim()} → ${to.trim()}`
      : code.trim()
    : name.trim();
  const canSave = !!trip && title.length > 0;

  const toggle = (personId: string) =>
    setRiders(
      selected.includes(personId)
        ? selected.filter((p) => p !== personId)
        : [...selected, personId]
    );

  const save = () => {
    if (!trip || !canSave) return;

    let startAt: Date | null = null;
    if (date) {
      startAt = fromISODate(date);
      if (time) {
        const [h, m] = time.split(':').map(Number);
        startAt.setHours(h ?? 0, m ?? 0, 0, 0);
      }
    }

    const details: ItemDetails | null =
      kind === 'flight'
        ? { kind: 'flight', flightNumber: code.trim() || undefined, seat: seat.trim() || undefined }
        : kind === 'train'
          ? { kind: 'transport', mode: 'train', operator: code.trim() || undefined }
          : kind === 'stay'
            ? { kind: 'lodging' }
            : { kind: 'activity' };

    createItem({
      tripId: trip.id,
      kind: ITEM_KIND[kind],
      title,
      startAt,
      isAllDay: !!date && !time,
      notes: address.trim() || null,
      details,
      personIds: selected,
    });
    router.back();
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="bg-background flex-1">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerClassName="gap-[18px] px-5 pb-5 pt-4">
          <View className="flex-row items-center justify-between">
            <Text variant="h1" className="text-[30px] leading-[30px]">
              {TITLES[kind]}
            </Text>
            <Pressable onPress={() => router.back()} accessibilityRole="button">
              <Text variant="body" className="text-muted-foreground">
                Cancel
              </Text>
            </Pressable>
          </View>

          <SegmentedControl options={KIND_OPTIONS} value={kind} onChange={setKind} />

          {isTransit ? (
            <>
              <View className="gap-[7px]">
                <Text variant="label">{kind === 'flight' ? 'Flight number' : 'Operator'}</Text>
                <Input
                  value={code}
                  onChangeText={setCode}
                  placeholder={kind === 'flight' ? 'KE 704' : 'Shinkansen'}
                  autoCapitalize="characters"
                />
              </View>
              <View className="flex-row gap-3">
                <View className="flex-1 gap-[7px]">
                  <Text variant="label">From</Text>
                  <Input value={from} onChangeText={setFrom} placeholder="Narita" />
                </View>
                <View className="flex-1 gap-[7px]">
                  <Text variant="label">To</Text>
                  <Input value={to} onChangeText={setTo} placeholder="Incheon" />
                </View>
              </View>
            </>
          ) : (
            <View className="gap-[7px]">
              <Text variant="label">{kind === 'stay' ? 'Hotel name' : 'Place name'}</Text>
              <Input
                value={name}
                onChangeText={setName}
                placeholder={kind === 'stay' ? 'Nest Hotel Myeongdong' : 'Gwangjang Market'}
              />
            </View>
          )}

          <View className="flex-row gap-3">
            <DateField label="Date" value={date} onChange={setDate} />
            <DateField label="Time" value={time} onChange={setTime} mode="time" placeholder="—" />
          </View>

          {kind === 'flight' ? (
            <View className="gap-[7px]">
              <Text variant="label">Seat</Text>
              <Input value={seat} onChangeText={setSeat} placeholder="24A" autoCapitalize="characters" />
            </View>
          ) : null}

          {!isTransit ? (
            <View className="gap-[7px]">
              <Text variant="label">Address</Text>
              <Input value={address} onChangeText={setAddress} placeholder="10 Toegye-ro, Jung-gu" />
            </View>
          ) : null}

          {people.length > 1 ? (
            <View className="gap-[9px]">
              <Text variant="label">
                {kind === 'flight' ? "Who's on this flight" : "Who's this for"}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {people.map((person, index) => {
                  const on = selected.includes(person.id);
                  return (
                    <Pressable
                      key={person.id}
                      onPress={() => toggle(person.id)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      className={cn(
                        'flex-row items-center gap-2 rounded-full py-[6px] pl-[6px] pr-[14px]',
                        on ? 'bg-primary' : 'bg-well'
                      )}
                    >
                      <View
                        className={cn(
                          'h-6 w-6 items-center justify-center rounded-full',
                          personColor(index)
                        )}
                      >
                        <Text className="font-body-semibold text-[11px] text-white">
                          {initialOf(person.displayName)}
                        </Text>
                      </View>
                      <Text
                        className={cn(
                          'font-body-medium text-[13px]',
                          on ? 'text-primary-foreground' : 'text-muted-foreground'
                        )}
                      >
                        {person.displayName}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}
        </ScrollView>

        <View className="border-border bg-background/95 border-t px-5 pb-4 pt-3">
          <Button size="block" onPress={save} disabled={!canSave}>
            <Text>Add to trip</Text>
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
