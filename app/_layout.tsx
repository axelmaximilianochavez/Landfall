import '../global.css';

import { Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useDatabaseMigrations } from '@/db';

export default function RootLayout() {
  const { success, error } = useDatabaseMigrations();

  if (error) {
    return (
      <View className="flex-1 items-center justify-center gap-2 p-6">
        <Text variant="h3">Database error</Text>
        <Text className="text-center">{error.message}</Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  return <Stack />;
}
