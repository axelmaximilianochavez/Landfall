import { cva, type VariantProps } from 'class-variance-authority';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

/** Status pills from the design canvas (artboard 1b, "Badges & status"). */
const badgeVariants = cva('self-start rounded-full px-[11px] py-[6px]', {
  variants: {
    variant: {
      ink: 'bg-primary',
      transit: 'bg-transit-muted',
      departing: 'bg-place-muted',
      settled: 'bg-settled-muted',
      owed: 'bg-owed-muted',
      paper: 'bg-paper',
      neutral: 'bg-well',
    },
  },
  defaultVariants: { variant: 'neutral' },
});

const badgeTextVariants = cva('font-body-medium text-[11px]', {
  variants: {
    variant: {
      ink: 'font-mono text-primary-foreground tracking-[0.66px]',
      transit: 'text-transit-strong',
      departing: 'text-place-strong',
      settled: 'text-settled-strong',
      owed: 'text-owed-strong',
      paper: 'text-paper-foreground',
      neutral: 'text-muted-foreground',
    },
  },
  defaultVariants: { variant: 'neutral' },
});

export function Badge({
  label,
  variant,
  className,
}: VariantProps<typeof badgeVariants> & { label: string; className?: string }) {
  return (
    <View className={cn(badgeVariants({ variant }), className)}>
      <Text className={badgeTextVariants({ variant })}>{label}</Text>
    </View>
  );
}
