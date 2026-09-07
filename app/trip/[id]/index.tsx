import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { LandfallLogo } from '@/components/landfall-logo';
import { InviteLinkCard } from '@/components/invite-link-card';
import { BalancesCard } from '@/components/balances-card';
import { ExpenseList } from '@/components/expense-list';
import { MoneySummary } from '@/components/money-summary';
import { PersonRow } from '@/components/person-row';
import { PersonSheet } from '@/components/person-sheet';
import { TimelineItemCard } from '@/components/timeline-item-card';
import { TripTabBar, type TripTab } from '@/components/trip-tab-bar';
import { AvatarStack, personColor } from '@/components/ui/avatar-stack';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { invitePerson, resendInvite, useTrip } from '@/db/queries/trip';
import { formatTripDates } from '@/lib/date';
import { currencySymbol } from '@/lib/money';
import { displayNameOf, initialOfPerson } from '@/lib/person';
import { groupTimeline } from '@/lib/timeline';
import { cn } from '@/lib/utils';

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

export default function TripDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { trip, error } = useTrip(id);
  const [tab, setTab] = useState<TripTab>('timeline');
  // Id of the person whose invite sheet is open, or null when closed.
  const [invitingId, setInvitingId] = useState<string | null>(null);

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
  const selfId = trip.people.find((p) => p.isSelf)?.id;

  return (
    <View className="bg-background flex-1">
      <SafeAreaView edges={['top']} className="flex-1">
        <View className="border-border flex-row items-center gap-3 border-b px-5 pb-3 pt-2">
          <BackButton />
          <View className="flex-1 gap-[2px]">
            <Text variant="h3">{trip.title}</Text>
            <Text variant="caption">
              {formatTripDates(trip.startDate, trip.endDate)} · totals in {trip.baseCurrency}
            </Text>
          </View>
          <AvatarStack names={names} size={28} ringClassName="border-background" />
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
                        <TimelineItemCard
                          key={item.id}
                          item={item}
                          onPress={() => router.push(`/trip/${trip.id}/item/${item.id}`)}
                          onLongPress={() => router.push(`/trip/${trip.id}/edit/${item.id}`)}
                        />
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

          {tab === 'people' ? (
            <View className="gap-4">
              <View className="gap-[3px]">
                <Text variant="h2">People</Text>
                <Text variant="bodySm" className="text-muted-foreground">
                  Everyone here can add items and log spend.
                </Text>
              </View>

              <View className="gap-2">
                {trip.people.map((person, index) => (
                  <PersonRow
                    key={person.id}
                    person={person}
                    index={index}
                    onSend={() => setInvitingId(person.id)}
                    onResend={() => resendInvite(person.id)}
                  />
                ))}
              </View>

              <InviteLinkCard tripId={trip.id} tripTitle={trip.title} />
            </View>
          ) : null}

          {tab === 'money' ? (
            <View className="gap-4">
              <MoneySummary
                expenses={trip.expenses}
                segments={trip.segments}
                baseCurrency={trip.baseCurrency}
                selfPersonId={selfId}
                peopleCount={trip.people.length}
              />

              {trip.expenses.length === 0 ? (
                <View className="bg-card items-center gap-3 rounded-lg px-6 py-[34px]">
                  <View className="opacity-35">
                    <LandfallLogo size={40} />
                  </View>
                  <Text variant="title">No expenses yet</Text>
                  <Text
                    variant="bodySm"
                    className="text-muted-foreground max-w-[250px] text-center leading-[19px]"
                  >
                    Log what anyone spends and Landfall keeps the split and the running total.
                    Nobody has to hold the receipts.
                  </Text>
                  <Button
                    className="mt-1 rounded-[12px] px-[22px] py-3"
                    onPress={() => router.push(`/trip/${trip.id}/expense/new`)}
                  >
                    <Text className="text-[14px]">Add first expense</Text>
                  </Button>
                </View>
              ) : null}

              {trip.expenses.length === 0 ? (
                <View className="bg-paper gap-3 rounded-xl p-4">
                  <Text variant="monoSm" className="text-paper-foreground">
                    SPLITTING WITH
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {trip.people.map((person, index) => (
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
                    ))}
                  </View>
                  <View className="border-border border-t" />
                  <View className="flex-row items-center justify-between">
                    <Text className="font-body-medium text-[13.5px]">Show totals in</Text>
                    <Text variant="mono" className="text-[13.5px]">
                      {trip.baseCurrency} · {currencySymbol(trip.baseCurrency)}
                    </Text>
                  </View>
                </View>
              ) : (
                <>
                  <BalancesCard
                    people={trip.people}
                    expenses={trip.expenses}
                    baseCurrency={trip.baseCurrency}
                  />
                  <ExpenseList
                    expenses={trip.expenses}
                    people={trip.people}
                    baseCurrency={trip.baseCurrency}
                    selfPersonId={selfId}
                  />
                </>
              )}
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>

      {tab === 'money' ? (
        <View className="border-border bg-background/95 flex-row gap-3 border-t px-5 pb-3 pt-3">
          <Button
            className="flex-1"
            size="sm"
            onPress={() => router.push(`/trip/${trip.id}/expense/new`)}
          >
            <Text className="text-[15px]">Add expense</Text>
          </Button>
          <Button
            className="flex-1"
            variant={trip.expenses.length ? 'settle' : 'outline'}
            size="sm"
            disabled={trip.expenses.length === 0}
            onPress={() => {}}
          >
            <Text className="text-[15px]">Settle up</Text>
          </Button>
        </View>
      ) : null}

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

      <PersonSheet
        visible={!!invitingId}
        personName={trip.people.find((p) => p.id === invitingId)?.displayName}
        onCancel={() => setInvitingId(null)}
        onSubmit={(email) => {
          if (invitingId) invitePerson(invitingId, email);
          setInvitingId(null);
        }}
      />
    </View>
  );
}
