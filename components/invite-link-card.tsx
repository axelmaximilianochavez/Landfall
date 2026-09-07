import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Share, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { inviteLinkForTrip, inviteUrlForTrip } from '@/lib/invite';

/**
 * The invite link block from the design (People · invite).
 *
 * Copy and Share are real; the link itself does not open anything yet — there
 * is no server to accept a join. See lib/invite.ts before shipping it.
 */
export function InviteLinkCard({ tripId, tripTitle }: { tripId: string; tripTitle: string }) {
  const [copied, setCopied] = useState(false);
  const link = inviteLinkForTrip(tripId);
  const url = inviteUrlForTrip(tripId);

  // Revert the button label after a moment, and never after unmount.
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    await Clipboard.setStringAsync(url);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setCopied(true);
  };

  const share = async () => {
    try {
      await Share.share({
        // Android reads `message`; iOS prefers `url` and appends it.
        message: `Join "${tripTitle}" on Landfall: ${url}`,
        url,
      });
    } catch {
      // The user dismissing the sheet throws on some platforms — not an error.
    }
  };

  return (
    <View className="bg-paper gap-3 rounded-xl p-4">
      <Text variant="monoSm" className="text-paper-foreground">
        INVITE LINK
      </Text>

      <View className="bg-card rounded-md px-4 py-[13px]">
        <Text variant="mono" className="text-[13.5px]" numberOfLines={1}>
          {link}
        </Text>
      </View>

      <View className="flex-row gap-3">
        <Button className="flex-1" size="sm" onPress={copy}>
          <Text className="text-[15px]">{copied ? 'Copied' : 'Copy link'}</Text>
        </Button>
        <Button className="flex-1" variant="outline" size="sm" onPress={share}>
          <Text className="text-[15px]">Share</Text>
        </Button>
      </View>
    </View>
  );
}
