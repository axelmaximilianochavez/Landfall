import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { personColor } from '@/components/ui/avatar-stack';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { createExpense } from '@/db/queries/expense';
import type { FullTrip } from '@/db/queries/trip';
import type { ItemKind } from '@/db/schema';
import {
  CATEGORY_LABEL,
  EXPENSE_CATEGORIES,
  currencySymbol,
  decimalsFor,
  formatMoney,
  groupDigits,
  parseAmountToMinor,
  sanitizeAmountInput,
  type ExpenseCategory,
} from '@/lib/money';
import { displayNameOf, initialOfPerson } from '@/lib/person';
import { evenShareMinor } from '@/lib/split';
import { cn } from '@/lib/utils';

/** The add-expense form. The route resolves the trip and renders this. */
/** Longest amount the field accepts. Separators do not count. */
const MAX_DIGITS = 7;

/** Linking a booking picks the obvious category; you can still change it. */
const CATEGORY_FOR_KIND: Record<ItemKind, ExpenseCategory> = {
  flight: 'transit',
  transport: 'transit',
  lodging: 'stay',
  activity: 'other',
};

/** The dot beside each booking, in that kind's colour (design canvas 1a). */
const KIND_DOT: Record<ItemKind, string> = {
  flight: 'bg-transit',
  transport: 'bg-transit',
  lodging: 'bg-stay',
  activity: 'bg-place',
};

export function ExpenseForm({ trip }: { trip: FullTrip }) {
  const [amountText, setAmountText] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [covers, setCovers] = useState<string[] | null>(null);
  const [paidBy, setPaidBy] = useState<string | null>(null);
  const [pickingPayer, setPickingPayer] = useState(false);
  const [itemId, setItemId] = useState<string | null>(null);
  const amountRef = useRef<TextInput>(null);

  const currency = trip.baseCurrency;
  const amountMinor = parseAmountToMinor(amountText, currency);
  const people = trip.people;
  const self = people.find((p) => p.isSelf);
  const covered = covers ?? people.map((p) => p.id); // default: everyone
  const payerId = paidBy ?? self?.id ?? people[0]?.id;
  const payer = people.find((p) => p.id === payerId);

  const canSave =
    !!amountMinor && amountMinor > 0 && description.trim().length > 0 && covered.length > 0 && !!payerId;

  const toggleCover = (personId: string) =>
    setCovers(covered.includes(personId) ? covered.filter((p) => p !== personId) : [...covered, personId]);

  const save = () => {
    if (!canSave || !amountMinor || !payerId) return;
    createExpense({
      tripId: trip.id,
      description: description.trim(),
      category,
      amountMinor,
      currency,
      paidByPersonId: payerId,
      spentAt: new Date(),
      coveredPersonIds: covered,
      itemId,
    });
    router.back();
  };

  // Bookings you can attach this to. Anything already paid for drops off the
  // list, so the same flight cannot be expensed twice.
  const spokenFor = new Set(trip.expenses.map((expense) => expense.itemId).filter(Boolean));
  const linkable = trip.items.filter((item) => !spokenFor.has(item.id));
  const linkedItem = trip.items.find((item) => item.id === itemId);

  const linkTo = (item: (typeof trip.items)[number]) => {
    if (item.id === itemId) {
      setItemId(null);
      return;
    }
    setItemId(item.id);
    setCategory(CATEGORY_FOR_KIND[item.kind]);
    // Only fill the description when there is nothing worth keeping, so
    // tapping a booking never wipes something you typed.
    if (!description.trim() || description.trim() === linkedItem?.title) {
      setDescription(item.title);
    }
  };

  const each = amountMinor && covered.length ? evenShareMinor(amountMinor, covered.length) : 0;
  const placeholder = decimalsFor(currency) === 0 ? '0' : '0.00';

  // Digits only, one separator, capped length. Returns null when the result
  // would be too long, and we drop the keystroke rather than truncate.
  const changeAmount = (next: string) => {
    const cleaned = sanitizeAmountInput(next, currency, MAX_DIGITS);
    if (cleaned !== null) setAmountText(cleaned);
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="bg-background flex-1">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerClassName="gap-5 px-5 pb-5 pt-4" keyboardShouldPersistTaps="handled">
          <View className="flex-row items-center justify-between">
            <Text variant="h1" className="text-[30px] leading-[30px]">
              Add expense
            </Text>
            <Pressable onPress={() => router.back()} accessibilityRole="button">
              <Text variant="body" className="text-muted-foreground">
                Cancel
              </Text>
            </Pressable>
          </View>

          {/* Amount is the point of this screen, so it gets the whole card. */}
          <Pressable
            onPress={() => amountRef.current?.focus()}
            accessibilityRole="none"
            className="bg-card items-center gap-1 overflow-hidden rounded-2xl px-5 py-6"
          >
            <Text variant="monoSm">AMOUNT · {currency.toUpperCase()}</Text>
            {/* The amount is drawn as text and the input sits invisibly on
                top. Letting a TextInput size itself fights its intrinsic
                width, clips the first digit once the text overflows, and
                leaves no room to group thousands. Drawing it means the layout
                is ours: always centred, never clipped, grouped as you type. */}
            <View className="w-full flex-row items-baseline justify-center">
              <Text className="font-display-medium text-subtle mr-[7px] text-[34px]">
                {currencySymbol(currency)}
              </Text>
              <Text
                className={cn(
                  'font-display-medium text-[52px]',
                  amountText ? 'text-foreground' : 'text-subtle'
                )}
              >
                {amountText ? groupDigits(amountText) : placeholder}
              </Text>
            </View>
            <TextInput
              ref={amountRef}
              value={amountText}
              onChangeText={changeAmount}
              keyboardType="decimal-pad"
              inputMode="decimal"
              autoFocus
              caretHidden
              accessibilityLabel={`Amount in ${currency}`}
              style={StyleSheet.absoluteFill}
              className="opacity-0"
            />
          </Pressable>

          <View className="gap-[7px]">
            <Text variant="label">What for</Text>
            <Input value={description} onChangeText={setDescription} placeholder="Ichiran Ueno" />
          </View>

          {linkable.length ? (
            <View className="gap-[9px]">
              <View className="gap-[3px]">
                <Text variant="label">Link to a booking · optional</Text>
                <Text variant="caption">
                  Attaches the cost to something on the timeline. Bookings already paid for are
                  not listed.
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="gap-2 pr-5"
              >
                {linkable.map((item) => {
                  const on = item.id === itemId;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => linkTo(item)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      className={cn(
                        'max-w-[220px] flex-row items-center gap-2 rounded-full py-[9px] pl-[12px] pr-[15px]',
                        on ? 'bg-primary' : 'bg-well'
                      )}
                    >
                      <View className={cn('h-[7px] w-[7px] rounded-full', KIND_DOT[item.kind])} />
                      <Text
                        numberOfLines={1}
                        className={cn(
                          'font-body-medium text-[13.5px]',
                          on ? 'text-primary-foreground' : 'text-muted-foreground'
                        )}
                      >
                        {item.title}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}

          <View className="flex-row flex-wrap gap-2">
            {EXPENSE_CATEGORIES.map((option) => {
              const on = option === category;
              return (
                <Pressable
                  key={option}
                  onPress={() => setCategory(option)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  className={cn('rounded-full px-[18px] py-[10px]', on ? 'bg-primary' : 'bg-well')}
                >
                  <Text
                    className={cn(
                      'font-body-medium text-[14px]',
                      on ? 'text-primary-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {CATEGORY_LABEL[option]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View className="gap-2">
            <View className="flex-row items-baseline justify-between">
              <Text variant="label">Covers</Text>
              {each > 0 ? (
                <Text variant="monoSm">{formatMoney(each, currency)} EACH</Text>
              ) : null}
            </View>
            <View className="bg-card overflow-hidden rounded-lg">
              {people.map((person, index) => {
                const on = covered.includes(person.id);
                return (
                  <Pressable
                    key={person.id}
                    onPress={() => toggleCover(person.id)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                    className={cn(
                      'flex-row items-center gap-3 px-4 py-[13px] active:opacity-70',
                      index > 0 && 'border-border border-t'
                    )}
                  >
                    <View
                      className={cn(
                        'h-8 w-8 items-center justify-center rounded-full',
                        personColor(index)
                      )}
                    >
                      <Text
                        className={cn(
                          'font-body-semibold text-[13px]',
                          index === 0 ? 'text-primary-foreground' : 'text-white'
                        )}
                      >
                        {initialOfPerson(person)}
                      </Text>
                    </View>
                    <Text variant="body" className="flex-1">
                      {person.isSelf ? 'You' : displayNameOf(person)}
                    </Text>
                    <View
                      className={cn(
                        'h-[26px] w-[26px] items-center justify-center rounded-[8px]',
                        on ? 'bg-primary' : 'border-input border'
                      )}
                    >
                      {on ? (
                        <Text className="text-primary-foreground text-[14px] leading-[16px]">✓</Text>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="gap-2">
            <Pressable
              onPress={() => setPickingPayer((open) => !open)}
              accessibilityRole="button"
              className="bg-well flex-row items-center justify-between rounded-md px-4 py-[14px] active:opacity-80"
            >
              <Text variant="body">Paid by</Text>
              <Text variant="body" className="text-muted-foreground">
                {payer ? (payer.isSelf ? 'You' : displayNameOf(payer)) : '—'}
              </Text>
            </Pressable>
            {pickingPayer ? (
              <View className="bg-card overflow-hidden rounded-lg">
                {people.map((person, index) => (
                  <Pressable
                    key={person.id}
                    onPress={() => {
                      setPaidBy(person.id);
                      setPickingPayer(false);
                    }}
                    accessibilityRole="button"
                    className={cn(
                      'flex-row items-center justify-between px-4 py-[13px] active:opacity-70',
                      index > 0 && 'border-border border-t'
                    )}
                  >
                    <Text variant="body">{person.isSelf ? 'You' : displayNameOf(person)}</Text>
                    {person.id === payerId ? <Text variant="monoSm">PAID</Text> : null}
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        </ScrollView>

        <View className="border-border bg-background/95 border-t px-5 pb-4 pt-3">
          <Button size="block" onPress={save} disabled={!canSave}>
            <Text>Save expense</Text>
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
