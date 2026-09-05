import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { fromISODate, toISODate } from '@/lib/date';

/**
 * Label + tappable field that opens the native date picker.
 * Value is a 'YYYY-MM-DD' calendar string, matching db/schema/trips.ts.
 */
export function DateField({
  label,
  value,
  onChange,
  placeholder = 'Pick a date',
  mode = 'date',
}: {
  label: string;
  /** 'YYYY-MM-DD' in date mode, 'HH:MM' in time mode. */
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  mode?: 'date' | 'time';
}) {
  const [open, setOpen] = useState(false);

  return (
    <View className="flex-1 gap-[7px]">
      <Text variant="label">{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        className="border-input bg-card rounded-md border px-4 py-[15px] active:opacity-80"
      >
        <Text variant="mono" className={value ? 'text-foreground text-[15px]' : 'text-subtle text-[15px]'}>
          {value ? (mode === 'time' ? value : formatShort(value)) : placeholder}
        </Text>
      </Pressable>

      {open ? (
        <DateTimePicker
          value={pickerValue(value, mode)}
          mode={mode}
          onChange={(event, picked) => {
            // Android dismisses itself; iOS keeps the picker mounted.
            setOpen(Platform.OS === 'ios' && event.type !== 'dismissed');
            if (event.type !== 'set' || !picked) return;
            onChange(mode === 'time' ? formatClock(picked) : toISODate(picked));
          }}
        />
      ) : null}
    </View>
  );
}

function pickerValue(value: string | null, mode: 'date' | 'time'): Date {
  if (!value) return new Date();
  if (mode === 'time') {
    const [h, m] = value.split(':').map(Number);
    const d = new Date();
    d.setHours(h ?? 0, m ?? 0, 0, 0);
    return d;
  }
  return fromISODate(value);
}

function formatClock(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatShort(iso: string) {
  const [, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[(m ?? 1) - 1]}`;
}
