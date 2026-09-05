import { Slot } from '@rn-primitives/slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { Platform, Text as RNText, type Role } from 'react-native';

import { cn } from '@/lib/utils';

/**
 * Type scale from the Landfall design canvas (artboard 1a, "Type").
 *
 * Space Grotesk carries names and numbers, Inter carries prose, JetBrains Mono
 * carries codes and labels, and Caveat is reserved for handwritten field notes
 * — never UI chrome.
 */
const textVariants = cva(
  cn('text-foreground font-body text-[15px]', Platform.select({ web: 'select-text' })),
  {
    variants: {
      variant: {
        default: '',
        /* Space Grotesk — names, headings */
        display: 'font-display text-[32px] leading-[32px] tracking-[-0.96px]',
        h1: 'font-display text-[27px] leading-[28px] tracking-[-0.81px]',
        h2: 'font-display text-[24px] leading-[26px] tracking-[-0.6px]',
        h3: 'font-display text-[21px] leading-[23px] tracking-[-0.52px]',
        title: 'font-display text-[17px] leading-[20px] tracking-[-0.17px]',
        subtitle: 'font-display text-[16px] leading-[19px] tracking-[-0.16px]',
        /* Space Grotesk, tabular — money and counts */
        metric: 'font-display-medium text-[40px] leading-[40px] tracking-[-1.2px]',
        metricSm: 'font-display-medium text-[19px] leading-[20px]',
        /* Inter — prose */
        body: 'text-[15px] leading-[22px]',
        bodySm: 'text-[13px] leading-[19px]',
        label: 'font-body-medium text-muted-foreground text-[12px] leading-[14px]',
        caption: 'text-subtle text-[11.5px] leading-[15px]',
        /* JetBrains Mono — codes, times, eyebrow labels */
        mono: 'font-mono text-[12px] tracking-[0.24px]',
        monoSm: 'font-mono text-subtle text-[10px] tracking-[0.8px]',
        /* Caveat — field notes only */
        hand: 'font-hand text-paper-foreground text-[20px] leading-[24px]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

type TextVariantProps = VariantProps<typeof textVariants>;
type TextVariant = NonNullable<TextVariantProps['variant']>;

const ROLE: Partial<Record<TextVariant, Role>> = {
  display: 'heading',
  h1: 'heading',
  h2: 'heading',
  h3: 'heading',
};

const ARIA_LEVEL: Partial<Record<TextVariant, string>> = {
  display: '1',
  h1: '1',
  h2: '2',
  h3: '3',
};

const TextClassContext = React.createContext<string | undefined>(undefined);

function Text({
  className,
  asChild = false,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof RNText> &
  React.RefAttributes<typeof RNText> &
  TextVariantProps & {
    asChild?: boolean;
  }) {
  const textClass = React.useContext(TextClassContext);
  const Component = asChild ? Slot : RNText;
  return (
    <Component
      className={cn(textVariants({ variant }), textClass, className)}
      role={variant ? ROLE[variant] : undefined}
      aria-level={variant ? ARIA_LEVEL[variant] : undefined}
      {...props}
    />
  );
}

export { Text, TextClassContext };
