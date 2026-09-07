import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { initialOf, personColor } from '@/components/ui/avatar-stack';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DateField } from '@/components/ui/date-field';
import { Input } from '@/components/ui/input';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Text } from '@/components/ui/text';
import { createItem, deleteItem, updateItem, type FullTrip, type TimelineItem } from '@/db/queries/trip';
import { formatTripDates } from '@/lib/date';
import { countryFlag, formatMinutes, lookupFlight, type FlightInfo } from '@/lib/flight-lookup';
import {
  applyFlightInfo,
  formStateFromItem,
  isTransitKind,
  itemPayloadFromState,
  type FlightLookupFields,
  type FormKind,
  type ItemFormState,
} from '@/lib/item-form';
import { segmentForDate } from '@/lib/timeline';
import { cn } from '@/lib/utils';

const KIND_OPTIONS: { value: FormKind; label: string }[] = [
  { value: 'flight', label: 'Flight' },
  { value: 'train', label: 'Train' },
  { value: 'stay', label: 'Stay' },
  { value: 'place', label: 'Place' },
];

const ADD_TITLES: Record<FormKind, string> = {
  flight: 'Add flight',
  train: 'Add train',
  stay: 'Add stay',
  place: 'Add place',
};

const EDIT_TITLES: Record<FormKind, string> = {
  flight: 'Edit flight',
  train: 'Edit train',
  stay: 'Edit stay',
  place: 'Edit place',
};

/**
 * The add/edit form for an itinerary item. Both routes render this, so the two
 * can never drift apart — an edit shows exactly the fields that created it.
 */
export function ItemForm({ trip, item }: { trip: FullTrip; item?: TimelineItem }) {
  const editing = !!item;
  const initial = formStateFromItem(item);

  const [kind, setKind] = useState<FormKind>(initial.kind);
  const [code, setCode] = useState(initial.code);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [name, setName] = useState(initial.name);
  const [seat, setSeat] = useState(initial.seat);
  const [gate, setGate] = useState(initial.gate);
  const [fromTerminal, setFromTerminal] = useState(initial.fromTerminal);
  const [toTerminal, setToTerminal] = useState(initial.toTerminal);
  const [confirmation, setConfirmation] = useState(initial.confirmation);
  const [car, setCar] = useState(initial.car);
  const [room, setRoom] = useState(initial.room);
  const [phone, setPhone] = useState(initial.phone);
  const [openingHours, setOpeningHours] = useState(initial.openingHours);
  const [endDate, setEndDate] = useState<string | null>(initial.endDate);
  const [lookup, setLookup] = useState<FlightLookupFields | null>(initial.lookup);
  const [looking, setLooking] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  // More than one leg can share a flight number, so we ask rather than guess.
  const [choices, setChoices] = useState<FlightInfo[] | null>(null);
  const [address, setAddress] = useState(initial.address);
  const [note, setNote] = useState(initial.note);
  const [date, setDate] = useState<string | null>(initial.date);
  const [time, setTime] = useState<string | null>(initial.time);
  const [endTime, setEndTime] = useState<string | null>(initial.endTime);
  const [riders, setRiders] = useState<string[] | null>(initial.personIds);
  const [pickedSegment, setPickedSegment] = useState<string | null>(initial.segmentId);
  const [confirming, setConfirming] = useState(false);
  // An existing item already has its destination decided; do not let the date
  // silently move it on open.
  const [segmentTouched, setSegmentTouched] = useState(editing);

  const isTransit = isTransitKind(kind);
  const people = trip.people;
  const selected = riders ?? people.map((p) => p.id); // default: everyone

  const tripStart = trip.startDate;
  const tripEnd = trip.endDate;
  const dateHint = tripStart || tripEnd ? `Within ${formatTripDates(tripStart, tripEnd)}` : undefined;

  const segments = trip.segments;
  const segmentId = segmentTouched ? pickedSegment : (segmentForDate(date, segments)?.id ?? null);

  const chooseSegment = (id: string) => {
    setSegmentTouched(true);
    setPickedSegment(segmentId === id ? null : id);
  };

  const toggle = (personId: string) =>
    setRiders(
      selected.includes(personId) ? selected.filter((p) => p !== personId) : [...selected, personId]
    );

  const payload = itemPayloadFromState({
    kind,
    code,
    from,
    to,
    name,
    seat,
    gate,
    fromTerminal,
    toTerminal,
    confirmation,
    car,
    room,
    phone,
    openingHours,
    lookup,
    address,
    note,
    date,
    time,
    endTime,
    endDate,
    segmentId,
    personIds: selected,
  });
  const canSave = payload.title.length > 0;

  /** Writes a looked-up leg into every field it knows about. */
  const applyLeg = (info: FlightInfo) => {
    const next = applyFlightInfo(
      {
        kind,
        code,
        from,
        to,
        name,
        seat,
        gate,
        fromTerminal,
        toTerminal,
        confirmation,
        car,
        room,
        phone,
        openingHours,
        lookup,
        address,
        note,
        date,
        time,
        endTime,
        endDate,
        segmentId,
        personIds: selected,
      } satisfies ItemFormState,
      info
    );
    setCode(next.code);
    setFrom(next.from);
    setTo(next.to);
    setFromTerminal(next.fromTerminal);
    setToTerminal(next.toTerminal);
    setGate(next.gate);
    setDate(next.date);
    setTime(next.time);
    setEndTime(next.endTime);
    setLookup(next.lookup);
    setChoices(null);
    setLookupError(null);
  };

  const runLookup = async () => {
    if (!code.trim() || !date) {
      setLookupError('Add the flight number and the date first.');
      return;
    }
    setLooking(true);
    setLookupError(null);
    const result = await lookupFlight(code, date);
    setLooking(false);

    if (!result.ok) {
      setLookupError(result.message);
      return;
    }
    if (result.flights.length === 1) {
      applyLeg(result.flights[0]);
      return;
    }
    setChoices(result.flights);
  };

  const save = () => {
    if (!canSave) return;
    const shared = { ...payload, segmentId, personIds: selected };
    if (item) updateItem({ id: item.id, ...shared });
    else createItem({ tripId: trip.id, ...shared });
    router.back();
  };

  const remove = () => {
    if (!item) return;
    setConfirming(false);
    deleteItem(item.id);
    router.back();
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="bg-background flex-1">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerClassName="gap-[18px] px-5 pb-5 pt-4" keyboardShouldPersistTaps="handled">
          <View className="flex-row items-center justify-between">
            <Text variant="h1" className="text-[30px] leading-[30px]">
              {(editing ? EDIT_TITLES : ADD_TITLES)[kind]}
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
                  placeholder={kind === 'flight' ? 'TR 885' : 'Shinkansen'}
                  autoCapitalize="characters"
                />
              </View>

              {/* Date comes straight after the number, because together they
                  are what the lookup needs. */}
              <View className="flex-row">
                <DateField
                  label="Date"
                  value={date}
                  onChange={setDate}
                  min={tripStart}
                  max={tripEnd}
                  hint={dateHint}
                />
              </View>

              {kind === 'flight' ? (
                <View className="gap-2">
                  <Button
                    variant="outline"
                    size="block"
                    onPress={runLookup}
                    disabled={looking || !code.trim() || !date}
                  >
                    <Text>{looking ? 'Looking up…' : 'Look up flight'}</Text>
                  </Button>

                  {lookupError ? (
                    <Text variant="caption" className="text-owed-strong">
                      {lookupError}
                    </Text>
                  ) : null}

                  {choices ? (
                    <View className="gap-2">
                      <Text variant="caption">
                        {choices.length} legs share that number — pick the one you are on.
                      </Text>
                      {choices.map((leg, index) => (
                        <Pressable
                          key={`${leg.fromIata}-${leg.toIata}-${index}`}
                          onPress={() => applyLeg(leg)}
                          accessibilityRole="button"
                          className="bg-card flex-row items-center justify-between gap-3 rounded-md p-4 active:opacity-80"
                        >
                          <View className="gap-[2px]">
                            <Text variant="subtitle">
                              {leg.fromIata} → {leg.toIata}
                            </Text>
                            <Text variant="caption">
                              {leg.departTime} – {leg.arriveTime} · {leg.aircraft ?? 'aircraft n/a'}
                            </Text>
                          </View>
                          <Text variant="monoSm">{formatMinutes(leg.durationMinutes) ?? ''}</Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : null}

                  {lookup?.lookedUpAt ? (
                    <View className="bg-transit-muted gap-[3px] rounded-md p-3">
                      <Text variant="monoSm" className="text-transit-strong">
                        FOUND FROM FLIGHT NUMBER
                      </Text>
                      <Text variant="bodySm" className="text-transit-strong">
                        {[
                          lookup.airline,
                          lookup.aircraft,
                          formatMinutes(lookup.durationMinutes ?? null),
                          lookup.distanceKm ? `${Math.round(lookup.distanceKm)} km` : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </Text>
                      <Text variant="bodySm" className="text-transit-strong">
                        {countryFlag(lookup.countryFrom)} {lookup.airportFromName ?? from} →{' '}
                        {countryFlag(lookup.countryTo)} {lookup.airportToName ?? to}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : null}

              <View className="flex-row gap-3">
                <View className="flex-1 gap-[7px]">
                  <Text variant="label">From</Text>
                  <Input value={from} onChangeText={setFrom} placeholder="NRT" />
                </View>
                <View className="flex-1 gap-[7px]">
                  <Text variant="label">To</Text>
                  <Input value={to} onChangeText={setTo} placeholder="SIN" />
                </View>
              </View>

              <View className="flex-row gap-3">
                <DateField
                  label="Departs"
                  value={time}
                  onChange={setTime}
                  mode="time"
                  placeholder="—"
                />
                <DateField
                  label="Arrives"
                  value={endTime}
                  onChange={setEndTime}
                  mode="time"
                  placeholder="—"
                />
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

          {kind === 'stay' ? (
            <>
              <View className="flex-row gap-3">
                <DateField
                  label="Check in"
                  value={date}
                  onChange={setDate}
                  min={tripStart}
                  max={tripEnd}
                  hint={dateHint}
                />
                <DateField label="at" value={time} onChange={setTime} mode="time" placeholder="15:00" />
              </View>
              <View className="flex-row gap-3">
                <DateField
                  label="Check out"
                  value={endDate}
                  onChange={setEndDate}
                  min={date ?? tripStart}
                  max={tripEnd}
                />
                <DateField
                  label="at"
                  value={endTime}
                  onChange={setEndTime}
                  mode="time"
                  placeholder="11:00"
                />
              </View>
            </>
          ) : (
            <View className="flex-row gap-3">
              <DateField
                label="Date"
                value={date}
                onChange={setDate}
                min={tripStart}
                max={tripEnd}
                hint={dateHint}
              />
              <DateField label="Time" value={time} onChange={setTime} mode="time" placeholder="—" />
            </View>
          )}

          {segments.length ? (
            <View className="gap-[9px]">
              <View className="gap-[3px]">
                <Text variant="label">Destination</Text>
                <Text variant="caption">
                  {segmentTouched || !segmentId
                    ? 'Tap to change. Leave it off and the date decides.'
                    : 'Chosen from the date — tap to override.'}
                </Text>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {segments.map((segment) => {
                  const on = segment.id === segmentId;
                  return (
                    <Pressable
                      key={segment.id}
                      onPress={() => chooseSegment(segment.id)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      className={cn('rounded-full px-[15px] py-[9px]', on ? 'bg-primary' : 'bg-well')}
                    >
                      <Text
                        className={cn(
                          'font-body-medium text-[13.5px]',
                          on ? 'text-primary-foreground' : 'text-muted-foreground'
                        )}
                      >
                        {segment.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          {isTransit ? (
            <>
              <View className="flex-row gap-3">
                <View className="flex-1 gap-[7px]">
                  <Text variant="label">{kind === 'flight' ? 'From terminal' : 'From platform'}</Text>
                  <Input
                    value={fromTerminal}
                    onChangeText={setFromTerminal}
                    placeholder="1"
                    autoCapitalize="characters"
                  />
                </View>
                <View className="flex-1 gap-[7px]">
                  <Text variant="label">{kind === 'flight' ? 'To terminal' : 'To platform'}</Text>
                  <Input
                    value={toTerminal}
                    onChangeText={setToTerminal}
                    placeholder="2"
                    autoCapitalize="characters"
                  />
                </View>
              </View>
              <View className="flex-row gap-3">
                {kind === 'flight' ? (
                  <View className="flex-1 gap-[7px]">
                    <Text variant="label">Gate</Text>
                    <Input value={gate} onChangeText={setGate} placeholder="18" autoCapitalize="characters" />
                  </View>
                ) : null}
                {kind === 'train' ? (
                  <View className="flex-1 gap-[7px]">
                    <Text variant="label">Car</Text>
                    <Input value={car} onChangeText={setCar} placeholder="4" autoCapitalize="characters" />
                  </View>
                ) : null}
                <View className="flex-1 gap-[7px]">
                  <Text variant="label">Seat</Text>
                  <Input value={seat} onChangeText={setSeat} placeholder="24A" autoCapitalize="characters" />
                </View>
              </View>
            </>
          ) : (
            <View className="gap-[7px]">
              <Text variant="label">Address</Text>
              <Input value={address} onChangeText={setAddress} placeholder="10 Toegye-ro, Jung-gu" />
            </View>
          )}

          {kind === 'stay' ? (
            <View className="flex-row gap-3">
              <View className="flex-1 gap-[7px]">
                <Text variant="label">Room</Text>
                <Input value={room} onChangeText={setRoom} placeholder="704 · Twin" />
              </View>
              <View className="flex-1 gap-[7px]">
                <Text variant="label">Phone</Text>
                <Input
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+81 3-6455-2101"
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          ) : null}

          {kind === 'place' ? (
            <View className="gap-[7px]">
              <Text variant="label">Opening hours</Text>
              <Input value={openingHours} onChangeText={setOpeningHours} placeholder="06:00 – 17:00" />
            </View>
          ) : null}

          {kind !== 'place' ? (
            <View className="gap-[7px]">
              <Text variant="label">Confirmation</Text>
              <Input
                value={confirmation}
                onChangeText={setConfirmation}
                placeholder="7QK4ZP"
                autoCapitalize="characters"
              />
            </View>
          ) : null}

          <View className="gap-[7px]">
            <Text variant="label">Notes</Text>
            <Input
              value={note}
              onChangeText={setNote}
              placeholder="Terminal 2 is the far one — leave the hotel by 07:30"
              multiline
              className="min-h-[76px] py-3"
              textAlignVertical="top"
            />
          </View>

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

        <View className="border-border bg-background/95 gap-[10px] border-t px-5 pb-4 pt-3">
          {editing ? (
            <Button variant="destructive" size="block" onPress={() => setConfirming(true)}>
              <Text>Remove from trip</Text>
            </Button>
          ) : null}
          <Button size="block" onPress={save} disabled={!canSave}>
            <Text>{editing ? 'Save changes' : 'Add to trip'}</Text>
          </Button>
        </View>
      </KeyboardAvoidingView>

      {item ? (
        <ConfirmDialog
          visible={confirming}
          title={`Remove ${item.title}?`}
          message="It leaves the timeline for everyone on this trip."
          confirmLabel="Remove from trip"
          cancelLabel="Keep it"
          onConfirm={remove}
          onCancel={() => setConfirming(false)}
        />
      ) : null}
    </SafeAreaView>
  );
}
