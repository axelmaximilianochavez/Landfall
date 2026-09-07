import { Pressable, View } from 'react-native';

import { personColor } from '@/components/ui/avatar-stack';
import { Text } from '@/components/ui/text';
import type { Person } from '@/db/schema';
import { formatRelativeTime } from '@/lib/date';
import { displayNameOf, initialOfPerson, inviteStatusOf } from '@/lib/person';
import { cn } from '@/lib/utils';

/**
 * One person on the trip. The card's treatment carries the invite state:
 * a solid card is someone who is really here, a dashed one is an invite
 * still in the air.
 */
export function PersonRow({
  person,
  index,
  onSend,
  onResend,
}: {
  person: Person;
  index: number;
  onSend: () => void;
  onResend: () => void;
}) {
  const status = inviteStatusOf(person);
  const pending = status === 'pending';
  const name = displayNameOf(person);

  const subtitle = person.isSelf
    ? 'You · created the trip'
    : pending
      ? person.invitedAt
        ? `Invited ${formatRelativeTime(person.invitedAt)}`
        : 'Invite sent'
      : status === 'accepted'
        ? 'On this trip'
        : 'Not invited yet';

  return (
    <View
      className={cn(
        'flex-row items-center gap-[14px] rounded-lg p-4',
        pending ? 'border-input border border-dashed' : 'bg-card'
      )}
    >
      <View
        className={cn(
          'h-[42px] w-[42px] items-center justify-center rounded-full',
          pending ? 'bg-well' : personColor(index)
        )}
      >
        <Text
          className={cn(
            'font-body-semibold text-[16px]',
            pending ? 'text-subtle' : index === 0 ? 'text-primary-foreground' : 'text-white'
          )}
        >
          {initialOfPerson(person)}
        </Text>
      </View>

      <View className="flex-1 gap-[2px]">
        <Text variant="subtitle" numberOfLines={1} className={cn(pending && 'text-muted-foreground')}>
          {name}
        </Text>
        <Text variant="caption" numberOfLines={1}>
          {subtitle}
        </Text>
      </View>

      {person.isSelf ? <Text variant="monoSm">OWNER</Text> : null}

      {!person.isSelf && status === 'none' ? (
        <Pressable onPress={onSend} accessibilityRole="button" hitSlop={8}>
          <Text className="font-body-medium text-foreground text-[14px]">Send</Text>
        </Pressable>
      ) : null}

      {pending ? (
        <Pressable onPress={onResend} accessibilityRole="button" hitSlop={8}>
          <Text className="font-body-medium text-muted-foreground text-[14px]">Resend</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
