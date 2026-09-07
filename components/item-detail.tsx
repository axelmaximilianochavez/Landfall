import { AntDesign } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { FlightRouteMap } from '@/components/flight-route-map';
import { TopoBackdrop } from '@/components/topo-backdrop';
import { personColor } from '@/components/ui/avatar-stack';
import { Text } from '@/components/ui/text';
import type { FullTrip, TimelineItem } from '@/db/queries/trip';
import { updateItemDetails } from '@/db/queries/trip';
import { formatDuration, toISODate } from '@/lib/date';
import { countryFlag, formatMinutes, lookupFlight } from '@/lib/flight-lookup';
import { formatMoney, toBaseMinor } from '@/lib/money';
import { displayNameOf, initialOfPerson } from '@/lib/person';
import { formatDayLabel, formatItemTime } from '@/lib/timeline';
import { cn } from '@/lib/utils';

const KIND_LABEL = {
  flight: 'FLIGHT',
  transport: 'TRAIN',
  lodging: 'STAY',
  activity: 'PLACE',
} as const;

const KIND_TINT = {
  flight: 'text-transit',
  transport: 'text-transit',
  lodging: 'text-stay',
  activity: 'text-place',
} as const;

/** '2 NIGHTS' for a stay, from check-in to check-out. */
function nightsBetween(from: Date, to: Date): number {
  return Math.max(1, Math.round((to.getTime() - from.getTime()) / 86_400_000));
}

function clock(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/** '12 Oct' — short enough to sit beside a time. */
const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function shortDate(date: Date): string {
  return `${date.getDate()} ${SHORT_MONTHS[date.getMonth()]}`;
}

/** A label/value line in the details card. Renders nothing without a value. */
function Row({ label, value, last }: { label: string; value?: string | null; last?: boolean }) {
  if (!value) return null;
  return (
    <View
      className={cn(
        'flex-row items-center justify-between gap-4 px-4 py-[15px]',
        !last && 'border-border border-b'
      )}
    >
      <Text variant="body" className="text-muted-foreground">
        {label}
      </Text>
      <Text variant="body" className="font-body-medium flex-1 text-right" numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

export function ItemDetail({ trip, item }: { trip: FullTrip; item: TimelineItem }) {
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const details = item.details;
  const transit = details?.kind === 'flight' || details?.kind === 'transport' ? details : null;
  const stay = details?.kind === 'lodging' || details?.kind === 'activity' ? details : null;

  const code =
    details?.kind === 'flight'
      ? details.flightNumber
      : details?.kind === 'transport'
        ? details.operator
        : null;

  // Cost comes from whatever expense was linked to this item on the Money tab.
  const expense = trip.expenses.find((candidate) => candidate.itemId === item.id);
  const payer = expense && trip.people.find((p) => p.id === expense.paidByPersonId);
  const onThis = item.people
    .map((link) => trip.people.find((p) => p.id === link.personId))
    .filter((p): p is NonNullable<typeof p> => !!p);

  /**
   * The API's block time wins over subtracting the two clock times.
   *
   * Departure and arrival are stored as local wall-clock at each airport, so
   * for anything crossing a timezone the subtraction is wrong — Tokyo 08:20 to
   * Singapore 14:35 looks like 6h 15m but is really 7h 15m.
   */
  const duration =
    formatMinutes(details?.kind === 'flight' ? (details.durationMinutes ?? null) : null) ??
    (item.startAt && item.endAt ? formatDuration(item.startAt, item.endAt) : null);
  const nights =
    item.kind === 'lodging' && item.startAt && item.endAt
      ? nightsBetween(item.startAt, item.endAt)
      : null;

  const headerSuffix =
    nights !== null ? `${nights} ${nights === 1 ? 'NIGHT' : 'NIGHTS'}` : (code ?? null);

  /** Opens the platform's maps app on a place name. */
  const seatValue = transit?.seat ?? null;
  // A place has no times in its header, so it says when it happens here.
  const timelineValue =
    item.kind === 'activity' && item.startAt
      ? `${formatDayLabel(toISODate(item.startAt))}${item.isAllDay ? '' : ` · ${clock(item.startAt)}`}`
      : null;

  // A place gets a light, map-like header instead of the dark instrument one,
  // matching the design. No real map yet — the crosshatch stands in for it.
  const onMap = item.kind === 'activity';
  const headerText = onMap ? 'text-foreground' : 'text-primary-foreground';
  const headerMuted = onMap ? 'text-muted-foreground' : 'text-[#CFCBBE]';
  const circleBg = onMap ? 'bg-card' : 'bg-[#FFFFFF1F]';
  const chevron = onMap ? '#14161A' : '#F7F5EE';

  const flight = details?.kind === 'flight' ? details : null;

  /**
   * Re-checks the flight. Worth a manual tap rather than a fetch on render:
   * the free plan is rate limited, and the only volatile fields are the gate,
   * the terminal and today's delay.
   */
  const refreshFlight = async () => {
    if (!flight?.flightNumber || !item.startAt) return;
    setRefreshing(true);
    setRefreshError(null);
    const result = await lookupFlight(flight.flightNumber, toISODate(item.startAt));
    setRefreshing(false);

    if (!result.ok) {
      setRefreshError(result.message);
      return;
    }
    // Match the leg we already have so a return flight cannot overwrite it.
    const match =
      result.flights.find(
        (leg) => leg.fromIata === flight.from && leg.toIata === flight.to
      ) ?? result.flights[0];

    updateItemDetails(item.id, {
      ...flight,
      departureTerminal: match.fromTerminal ?? flight.departureTerminal,
      arrivalTerminal: match.toTerminal ?? flight.arrivalTerminal,
      gate: match.fromGate ?? flight.gate,
      liveStatus: match.status ?? undefined,
      revisedDeparture: match.departRevisedTime ?? undefined,
      revisedArrival: match.arriveRevisedTime ?? undefined,
      durationMinutes: match.durationMinutes ?? flight.durationMinutes,
      lookedUpAt: match.checkedAt,
    });
  };

  /**
   * Opens the platform's maps app. Offered for a stay or a place, where it
   * navigates you somewhere — not for a journey, where the route map above
   * already shows what there is to see.
   */
  const openInMaps = () => {
    const query = transit ? (transit.to ?? transit.from ?? item.title) : (stay?.address ?? item.title);
    const url = Platform.select({
      ios: `maps://?q=${encodeURIComponent(query)}`,
      android: `geo:0,0?q=${encodeURIComponent(query)}`,
      default: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
    });
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View className="bg-background flex-1">
      <ScrollView contentContainerClassName="pb-8">
        {/* Dark header: the two times are the point of a flight. */}
        <View className={cn('px-5 pb-5', onMap ? 'bg-well' : 'bg-foreground')}>
          {onMap ? <TopoBackdrop /> : null}
          {onMap ? (
            <View className="absolute right-8 top-[86px] h-[18px] w-[18px] items-center justify-center">
              <View className="bg-place/25 absolute h-[30px] w-[30px] rounded-full" />
              <View className="bg-place h-[15px] w-[15px] rounded-full border-2 border-background" />
            </View>
          ) : null}
          <SafeAreaView edges={['top']}>
            <View className="flex-row items-center justify-between pb-4 pt-2">
              <Pressable
                onPress={() => (router.canGoBack() ? router.back() : router.replace(`/trip/${trip.id}`))}
                accessibilityRole="button"
                accessibilityLabel="Back"
                className={cn(
                  'h-[34px] w-[34px] items-center justify-center rounded-full active:opacity-70',
                  circleBg
                )}
              >
                <Svg width={18} height={18} viewBox="0 0 24 24">
                  <Path
                    d="M15 5l-7 7 7 7"
                    stroke={chevron}
                    strokeWidth={2.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </Svg>
              </Pressable>

              <Text variant="mono" className={cn('text-[13px]', KIND_TINT[item.kind])}>
                {KIND_LABEL[item.kind]}
                {headerSuffix ? ` · ${headerSuffix}` : ''}
              </Text>

              <Pressable
                onPress={() => router.push(`/trip/${trip.id}/edit/${item.id}`)}
                accessibilityRole="button"
                accessibilityLabel="Edit"
                className={cn(
                  'h-[34px] w-[34px] items-center justify-center rounded-full active:opacity-70',
                  circleBg
                )}
              >
                <AntDesign name="ellipsis" size={18} color={chevron} />
              </Pressable>
            </View>

            {transit ? (
              <View className="flex-row items-center justify-between gap-3">
                <View className="gap-[2px]">
                  <Text variant="metric" className="text-primary-foreground text-[42px]">
                    {formatItemTime(item)}
                  </Text>
                  <Text variant="monoSm" className="text-[#CFCBBE]">
                    {[transit.from, transit.departureTerminal && `TERMINAL ${transit.departureTerminal}`]
                      .filter(Boolean)
                      .join(' · ')
                      .toUpperCase()}
                  </Text>
                </View>

                <View className="flex-1 items-center gap-1">
                  {duration ? (
                    <Text variant="monoSm" className="text-[#8A8D95]">
                      {duration}
                    </Text>
                  ) : null}
                  <View className="h-px w-full bg-[#FFFFFF33]" />
                </View>

                <View className="items-end gap-[2px]">
                  <Text variant="metric" className="text-primary-foreground text-[42px]">
                    {item.endAt
                      ? `${String(item.endAt.getHours()).padStart(2, '0')}:${String(item.endAt.getMinutes()).padStart(2, '0')}`
                      : '—'}
                  </Text>
                  <Text variant="monoSm" className="text-[#CFCBBE]">
                    {[transit.to, transit.arrivalTerminal && `TERMINAL ${transit.arrivalTerminal}`]
                      .filter(Boolean)
                      .join(' · ')
                      .toUpperCase()}
                  </Text>
                </View>
              </View>
            ) : item.kind === 'lodging' ? (
              <View className="gap-4">
                <View className="gap-[6px]">
                  <Text variant="h1" className="text-primary-foreground">
                    {item.title}
                  </Text>
                  {stay?.address ? (
                    <Text variant="body" className="text-[#CFCBBE]">
                      {stay.address}
                    </Text>
                  ) : null}
                </View>

                <View className="gap-3">
                  {item.startAt ? (
                    <View className="gap-[2px]">
                      <Text variant="monoSm" className="text-[#8A8D95]">
                        CHECK IN
                      </Text>
                      <View className="flex-row items-center gap-3">
                        <Text variant="metricSm" className="text-primary-foreground text-[26px]">
                          {shortDate(item.startAt)}
                          {item.isAllDay ? '' : ` · ${clock(item.startAt)}`}
                        </Text>
                        <View className="h-px flex-1 bg-[#FFFFFF33]" />
                      </View>
                    </View>
                  ) : null}
                  {item.endAt ? (
                    <View className="gap-[2px]">
                      <Text variant="monoSm" className="text-[#8A8D95]">
                        CHECK OUT
                      </Text>
                      <View className="flex-row items-center gap-3">
                        <Text variant="metricSm" className="text-primary-foreground text-[26px]">
                          {shortDate(item.endAt)} · {clock(item.endAt)}
                        </Text>
                        <View className="h-px flex-1 bg-[#FFFFFF33]" />
                      </View>
                    </View>
                  ) : null}
                </View>
              </View>
            ) : (
              <View className="gap-[6px]">
                <Text variant="h1" className={headerText}>
                  {item.title}
                </Text>
                {stay?.address ? (
                  <Text variant="body" className={headerMuted}>
                    {stay.address}
                  </Text>
                ) : null}
                <Text variant="monoSm" className={headerMuted}>
                  {item.startAt ? formatDayLabel(toISODate(item.startAt)) : 'NO DATE YET'}
                  {item.startAt && !item.isAllDay ? ` · ${formatItemTime(item)}` : ''}
                </Text>
              </View>
            )}

            {flight?.lookedUpAt ? (
              <View className="mt-3 gap-[6px]">
                <Text variant="bodySm" className="text-[#CFCBBE]">
                  {countryFlag(flight.countryFrom)} {flight.airportFromName ?? flight.from} →{' '}
                  {countryFlag(flight.countryTo)} {flight.airportToName ?? flight.to}
                </Text>
                <Text variant="monoSm" className="text-[#8A8D95]">
                  {[
                    flight.airline,
                    flight.aircraft,
                    formatMinutes(flight.durationMinutes ?? null),
                    flight.distanceKm ? `${Math.round(flight.distanceKm)} KM` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')
                    .toUpperCase()}
                </Text>
                {/* Only name what moved. Repeating the scheduled time next to
                    "Now" reads as a delay that has not happened. */}
                {flight.revisedDeparture || flight.revisedArrival ? (
                  <Text variant="bodySm" className="text-place">
                    {[
                      flight.revisedDeparture ? `departs ${flight.revisedDeparture}` : null,
                      flight.revisedArrival ? `arrives ${flight.revisedArrival}` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                    {flight.liveStatus ? ` · ${flight.liveStatus}` : ''}
                  </Text>
                ) : flight.liveStatus ? (
                  <Text variant="bodySm" className="text-[#8A8D95]">
                    {flight.liveStatus}
                  </Text>
                ) : null}
              </View>
            ) : null}

            <View className="mt-4 flex-row gap-2">
              {!transit ? (
                <Pressable
                  onPress={openInMaps}
                  accessibilityRole="button"
                  className={cn(
                    'rounded-full px-4 py-[11px] active:opacity-90',
                    onMap ? 'bg-primary' : 'bg-primary-foreground'
                  )}
                >
                  <Text
                    className={cn(
                      'font-body-semibold text-[13px]',
                      onMap ? 'text-primary-foreground' : 'text-foreground'
                    )}
                  >
                    Open in Maps
                  </Text>
                </Pressable>
              ) : null}

              {flight?.flightNumber && item.startAt ? (
                <Pressable
                  onPress={refreshFlight}
                  disabled={refreshing}
                  accessibilityRole="button"
                  className="bg-primary-foreground rounded-full px-4 py-[11px] active:opacity-90"
                >
                  <Text className="font-body-semibold text-foreground text-[13px]">
                    {refreshing ? 'Checking…' : 'Refresh'}
                  </Text>
                </Pressable>
              ) : null}

              {!expense ? (
                <Pressable
                  onPress={() => router.push(`/trip/${trip.id}/expense/new`)}
                  accessibilityRole="button"
                  className={cn(
                    'rounded-full px-4 py-[11px] active:opacity-70',
                    onMap ? 'border-input bg-card border' : 'bg-[#FFFFFF1F]'
                  )}
                >
                  <Text
                    className={cn(
                      'font-body-semibold text-[13px]',
                      onMap ? 'text-foreground' : 'text-primary-foreground'
                    )}
                  >
                    Add expense
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </SafeAreaView>
        </View>

        <View className="gap-4 px-5 pt-4">
          {flight?.fromLat != null &&
          flight.fromLon != null &&
          flight.toLat != null &&
          flight.toLon != null ? (
            <FlightRouteMap
              from={{ latitude: flight.fromLat, longitude: flight.fromLon }}
              to={{ latitude: flight.toLat, longitude: flight.toLon }}
              fromLabel={flight.from}
              toLabel={flight.to}
            />
          ) : null}

          {refreshError ? (
            <Text variant="caption" className="text-owed-strong">
              {refreshError}
            </Text>
          ) : null}
          <View className="bg-card overflow-hidden rounded-lg">
            <Row label="Line" value={details?.kind === 'transport' ? details.operator : null} />
            <Row label="Gate" value={details?.kind === 'flight' ? details.gate : null} />
            <Row label="Car" value={details?.kind === 'transport' ? details.car : null} />
            <Row label="Seat" value={seatValue} />
            <Row label="Room" value={details?.kind === 'lodging' ? details.room : null} />
            <Row label="Phone" value={details?.kind === 'lodging' ? details.phone : null} />
            <Row label="Opens" value={details?.kind === 'activity' ? details.openingHours : null} />
            <Row label="Airline" value={flight?.airline} />
            <Row label="Aircraft" value={flight?.aircraft} />
            <Row
              label="Distance"
              value={flight?.distanceKm ? `${Math.round(flight.distanceKm)} km` : null}
            />
            <Row label="Status" value={flight?.liveStatus} />
            <Row label="On the timeline" value={timelineValue} />
            <Row
              label="Confirmation"
              value={details && 'confirmationCode' in details ? details.confirmationCode : null}
            />
            <Row
              label={item.kind === 'activity' ? 'Logged here' : 'Cost'}
              last
              value={
                expense
                  ? `${formatMoney(toBaseMinor(expense.amountMinor, expense.rateToBaseMicros), trip.baseCurrency)}${
                      payer ? ` · ${payer.isSelf ? 'you' : displayNameOf(payer)} paid` : ''
                    }`
                  : item.kind === 'activity'
                    ? 'Nothing yet'
                    : null
              }
            />
          </View>

          {onThis.length ? (
            <View className="gap-2">
              <Text variant="monoSm">
                {item.kind === 'flight'
                  ? 'ON THIS FLIGHT'
                  : item.kind === 'transport'
                    ? 'ON THIS TRAIN'
                    : item.kind === 'lodging'
                      ? 'STAYING HERE'
                      : "WHO'S GOING"}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {onThis.map((person) => {
                  const index = trip.people.findIndex((p) => p.id === person.id);
                  return (
                    <View
                      key={person.id}
                      className="bg-card flex-row items-center gap-2 rounded-full py-[6px] pl-[6px] pr-[14px]"
                    >
                      <View
                        className={cn(
                          'h-6 w-6 items-center justify-center rounded-full',
                          personColor(index)
                        )}
                      >
                        <Text
                          className={cn(
                            'font-body-semibold text-[11px]',
                            index === 0 ? 'text-primary-foreground' : 'text-white'
                          )}
                        >
                          {initialOfPerson(person)}
                        </Text>
                      </View>
                      <Text className="font-body-medium text-[13.5px]">
                        {person.isSelf ? 'You' : displayNameOf(person)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}

          {item.notes ? <Text variant="hand">{item.notes}</Text> : null}
        </View>
      </ScrollView>
    </View>
  );
}
