import { router } from 'expo-router';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';

/** Shown while the trip loads, or when the target no longer exists. */
export function FormFallback({ error, message }: { error?: Error; message?: string }) {
  const text = error?.message ?? message;
  return (
    <SafeAreaView edges={['top']} className="bg-background flex-1 px-5 pt-4">
      <Pressable onPress={() => router.back()} accessibilityRole="button" className="self-start">
        <Text variant="body" className="text-muted-foreground">
          Cancel
        </Text>
      </Pressable>
      <View className="flex-1 items-center justify-center">
        {text ? (
          <Text variant="bodySm" className="text-muted-foreground text-center">
            {text}
          </Text>
        ) : (
          <ActivityIndicator />
        )}
      </View>
    </SafeAreaView>
  );
}
