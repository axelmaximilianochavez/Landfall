import '../global.css';

import { Caveat_500Medium } from '@expo-google-fonts/caveat';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
} from '@expo-google-fonts/space-grotesk';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useDatabaseInspector, useDatabaseMigrations } from '@/db';

// Hold the splash screen until both the fonts and the schema are ready, so the
// first frame is never unstyled text.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const { success, error } = useDatabaseMigrations();

  // Dev-only: lets Drizzle Studio browse the on-device database.
  useDatabaseInspector();

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    JetBrainsMono_500Medium,
    Caveat_500Medium,
  });

  const ready = (fontsLoaded || !!fontError) && (success || !!error);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  if (error) {
    return (
      <View className="bg-background flex-1 items-center justify-center gap-2 p-6">
        <Text variant="h3">Database error</Text>
        <Text variant="body" className="text-center">
          {error.message}
        </Text>
      </View>
    );
  }

  // Order matters: expo-router places explicitly declared screens FIRST, and
  // React Navigation treats the first screen as the initial route.
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FAFAF7' } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
      <Stack.Screen name="dashboard" options={{ animation: 'fade' }} />
      <Stack.Screen name="trip/[id]/index" />
      <Stack.Screen name="trip/new" options={{ presentation: 'modal' }} />
      <Stack.Screen name="trip/[id]/add" options={{ presentation: 'modal' }} />
      <Stack.Screen name="trip/[id]/item/[itemId]" />
      <Stack.Screen name="trip/[id]/edit/[itemId]" options={{ presentation: 'modal' }} />
      <Stack.Screen name="trip/[id]/expense/new" options={{ presentation: 'modal' }} />
      <Stack.Screen name="j/[code]" />
    </Stack>
  );
}
