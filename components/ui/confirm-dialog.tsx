import { AntDesign } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';

/**
 * In-app confirmation, in place of the system Alert so it carries the app's
 * own type and colour.
 *
 * The destructive action sits above the safe one and is the only coloured
 * thing on the card, so the eye lands on what the button will actually do.
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Keep it',
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      // Android's hardware back must dismiss, not fall through to the screen.
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      {/* Tapping outside cancels, which is the safe outcome. */}
      <Pressable onPress={onCancel} className="flex-1 items-center justify-center px-6">
        <BlurView
          intensity={18}
          tint="dark"
          // Android only does a real blur behind this flag; without it the
          // view falls back to a flat tint, which the dim below covers.
          experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
          style={StyleSheet.absoluteFill}
        />
        <View style={StyleSheet.absoluteFill} className="bg-foreground/35" />

        {/* Swallow presses on the card so it does not dismiss itself. */}
        <Pressable
          onPress={() => {}}
          className="bg-background w-full max-w-[360px] overflow-hidden rounded-4xl"
          style={{
            shadowColor: '#14161A',
            shadowOpacity: 0.25,
            shadowRadius: 30,
            shadowOffset: { width: 0, height: 16 },
            elevation: 12,
          }}
        >
          <View className="items-center gap-3 px-6 pb-5 pt-7">
            <View className="bg-owed-muted h-[62px] w-[62px] items-center justify-center rounded-full">
              <AntDesign name="delete" size={26} color="#C93B3B" />
            </View>
            <Text variant="h2" className="text-center text-[23px] leading-[27px]">
              {title}
            </Text>
            {message ? (
              <Text variant="body" className="text-muted-foreground text-center leading-[21px]">
                {message}
              </Text>
            ) : null}
          </View>

          <View className="border-border border-t" />
          <Pressable onPress={onConfirm} accessibilityRole="button" className="items-center py-[15px] active:opacity-60">
            <Text className="font-body-semibold text-owed-strong text-[17px]">{confirmLabel}</Text>
          </Pressable>

          <View className="border-border border-t" />
          <Pressable onPress={onCancel} accessibilityRole="button" className="items-center py-[15px] active:opacity-60">
            <Text className="font-body-semibold text-foreground text-[17px]">{cancelLabel}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
