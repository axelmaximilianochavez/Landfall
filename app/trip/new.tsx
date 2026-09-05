import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { DateField } from '@/components/ui/date-field';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { initialOf, personColor } from '@/components/ui/avatar-stack';
import { isDatabaseAvailable } from '@/db';
import { createTrip, type NewCountry } from '@/db/queries/trips';

export default function NewTrip() {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [countries, setCountries] = useState<NewCountry[]>([]);
  const [companions, setCompanions] = useState<string[]>([]);
  const [companionDraft, setCompanionDraft] = useState('');

  const canSave = isDatabaseAvailable && title.trim().length > 0;

  const patchCountry = (index: number, patch: Partial<NewCountry>) =>
    setCountries((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));

  const addCompanion = () => {
    const name = companionDraft.trim();
    if (!name) return;
    setCompanions((prev) => [...prev, name]);
    setCompanionDraft('');
  };

  const save = () => {
    if (!canSave) return;
    const tripId = createTrip({
      title: title.trim(),
      startDate,
      endDate,
      countries: countries.filter((c) => c.name.trim().length > 0),
      companions,
    });
    // Straight into the trip you just made, and replace so Back returns to the list.
    router.replace(`/trip/${tripId}`);
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="bg-background flex-1">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerClassName="gap-[22px] px-5 pb-5 pt-6" keyboardShouldPersistTaps="handled">
          <View className="gap-[5px]">
            <Text variant="h1" className="text-[30px] leading-[30px]">
              New trip
            </Text>
            <Text variant="bodySm" className="text-muted-foreground text-[13.5px]">
              Countries first — the timeline builds around them.
            </Text>
          </View>

          <View className="gap-[7px]">
            <Text variant="label">Trip name</Text>
            <Input value={title} onChangeText={setTitle} placeholder="Tokyo → Seoul" autoFocus />
          </View>

          <View className="flex-row gap-3">
            <DateField label="Start" value={startDate} onChange={setStartDate} />
            <DateField label="End" value={endDate} onChange={setEndDate} />
          </View>

          <View className="gap-[9px]">
            <Text variant="label">Countries · in order</Text>
            {countries.map((country, index) => (
              <View key={index} className="bg-card gap-3 rounded-md p-4">
                <View className="flex-row items-center gap-3">
                  <Text variant="mono" className="text-subtle text-[11px]">
                    {String(index + 1).padStart(2, '0')}
                  </Text>
                  <Input
                    value={country.name}
                    onChangeText={(name) => patchCountry(index, { name })}
                    placeholder="Japan"
                    className="flex-1 border-0 bg-transparent px-0 py-0"
                  />
                  <Pressable
                    onPress={() => setCountries((prev) => prev.filter((_, i) => i !== index))}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${country.name || 'country'}`}
                  >
                    <Text className="text-subtle text-[18px]">×</Text>
                  </Pressable>
                </View>
                <View className="flex-row gap-3">
                  <DateField
                    label="From"
                    value={country.startDate ?? null}
                    onChange={(startDate) => patchCountry(index, { startDate })}
                  />
                  <DateField
                    label="To"
                    value={country.endDate ?? null}
                    onChange={(endDate) => patchCountry(index, { endDate })}
                  />
                </View>
              </View>
            ))}
            <Pressable
              onPress={() => setCountries((prev) => [...prev, { name: '' }])}
              accessibilityRole="button"
              className="border-input items-center rounded-md border border-dashed px-4 py-[14px] active:opacity-70"
            >
              <Text className="font-body-medium text-subtle text-[14px]">+ Add country</Text>
            </Pressable>
          </View>

          <View className="gap-[9px]">
            <Text variant="label">Travelling with</Text>
            {companions.length ? (
              <View className="flex-row flex-wrap gap-2">
                {companions.map((name, index) => (
                  <Pressable
                    key={`${name}-${index}`}
                    onPress={() => setCompanions((prev) => prev.filter((_, i) => i !== index))}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${name}`}
                    className="bg-well flex-row items-center gap-2 rounded-full py-[7px] pl-[7px] pr-[15px]"
                  >
                    <View
                      className={`h-6 w-6 items-center justify-center rounded-full ${personColor(index + 1)}`}
                    >
                      <Text className="font-body-semibold text-[11px] text-white">
                        {initialOf(name)}
                      </Text>
                    </View>
                    <Text className="font-body-medium text-[13.5px]">{name}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            <View className="flex-row gap-2">
              <Input
                value={companionDraft}
                onChangeText={setCompanionDraft}
                placeholder="Add someone"
                className="flex-1"
                returnKeyType="done"
                onSubmitEditing={addCompanion}
              />
              <Button variant="outline" onPress={addCompanion} disabled={!companionDraft.trim()}>
                <Text>Add</Text>
              </Button>
            </View>
          </View>

          <View className="bg-paper flex-row items-center justify-between rounded-md px-4 py-[14px]">
            <Text className="font-body-medium text-[13.5px]">Show totals in</Text>
            <Text variant="mono" className="text-[13.5px]">
              JPY
            </Text>
          </View>

          {!isDatabaseAvailable ? (
            <Text variant="bodySm" className="text-muted-foreground">
              The database is unavailable on web — run on iOS or Android to create a trip.
            </Text>
          ) : null}
        </ScrollView>

        <View className="border-border bg-background/95 border-t px-5 pb-4 pt-3">
          <Button size="block" onPress={save} disabled={!canSave}>
            <Text>Create trip</Text>
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
