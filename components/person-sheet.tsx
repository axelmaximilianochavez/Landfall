import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';

/**
 * Asks for the address to send someone's invite to. They are already on the
 * trip by name, so the email is the only thing missing.
 */
export function PersonSheet({
  visible,
  personName,
  onSubmit,
  onCancel,
}: {
  visible: boolean;
  personName?: string;
  onSubmit: (email: string) => void;
  onCancel: () => void;
}) {
  const [email, setEmail] = useState('');

  const trimmedEmail = email.trim();
  // A crude check on purpose: rejecting valid-but-unusual addresses is worse
  // than letting a typo through, since nothing is sent yet anyway.
  const canSubmit = /\S+@\S+\.\S+/.test(trimmedEmail);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
      // Clear on open rather than in an effect, so the previous person's
      // details never flash and the React Compiler stays happy.
      onShow={() => setEmail('')}
      statusBarTranslucent
    >
      <Pressable onPress={onCancel} className="flex-1 justify-end">
        <View style={StyleSheet.absoluteFill} className="bg-foreground/40" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable onPress={() => {}} className="bg-background gap-4 rounded-t-4xl px-5 pb-8 pt-3">
            <View className="bg-input h-1 w-[38px] self-center rounded-full" />

            <View className="gap-[4px]">
              <Text variant="h2" className="text-[22px]">
                Invite {personName ?? 'them'}
              </Text>
              <Text variant="bodySm" className="text-muted-foreground">
                They will get a link to join this trip.
              </Text>
            </View>

            <View className="gap-[7px]">
              <Text variant="label">Email</Text>
              <Input
                value={email}
                onChangeText={setEmail}
                placeholder="yuki@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                autoFocus
                returnKeyType="done"
                onSubmitEditing={() => canSubmit && onSubmit(trimmedEmail)}
              />
            </View>

            <Button
              size="block"
              disabled={!canSubmit}
              onPress={() => onSubmit(trimmedEmail)}
            >
              <Text>Send invite</Text>
            </Button>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}
