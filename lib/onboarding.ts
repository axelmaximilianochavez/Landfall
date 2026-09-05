import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const KEY = 'landfall.onboarding.seen.v1';

/**
 * Whether the first-run intro has been shown.
 *
 * Stored outside SQLite on purpose: this is a per-install UI flag, not trip
 * data, and it must survive the database being migrated or cleared.
 *
 * `seen` is undefined until the read resolves — callers should wait rather
 * than treat that as "not seen", or the intro flashes on every launch.
 */
export function useOnboardingSeen() {
  const [seen, setSeen] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(KEY)
      .then((value) => {
        if (active) setSeen(value === '1');
      })
      // A storage failure should not lock anyone out of the app.
      .catch(() => {
        if (active) setSeen(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const markSeen = useCallback(async () => {
    setSeen(true);
    await AsyncStorage.setItem(KEY, '1').catch(() => {});
  }, []);

  return { seen, markSeen };
}

/** Dev helper: clear the flag so the intro shows again on next launch. */
export async function resetOnboarding(): Promise<void> {
  await AsyncStorage.removeItem(KEY).catch(() => {});
}
