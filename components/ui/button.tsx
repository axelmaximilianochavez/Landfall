import { cva, type VariantProps } from 'class-variance-authority';
import { Platform, Pressable } from 'react-native';

import { TextClassContext } from '@/components/ui/text';
import { cn } from '@/lib/utils';

/**
 * Buttons from the Landfall design canvas (artboard 1b, "Buttons").
 *
 * default  — ink CTA, 14px radius        ("Add to trip")
 * outline  — white on a #D8D4C9 hairline ("Open in Maps")
 * pill     — well-filled chip, fully round ("Filter")
 * settle   — the one orange CTA, money only ("Settle up")
 * onInk    — bone fill, for use on ink surfaces
 * fab      — 52px round ink circle
 */
const buttonVariants = cva(
  cn(
    'group shrink-0 flex-row items-center justify-center gap-2',
    Platform.select({
      web: "outline-none transition-all disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0",
    })
  ),
  {
    variants: {
      variant: {
        default: cn('bg-primary rounded-md', Platform.select({ web: 'hover:opacity-90' })),
        outline: cn(
          'border-input bg-card rounded-md border',
          Platform.select({ web: 'hover:bg-well' })
        ),
        pill: cn('bg-well rounded-full', Platform.select({ web: 'hover:opacity-80' })),
        settle: cn('bg-place rounded-md', Platform.select({ web: 'hover:opacity-90' })),
        onInk: cn('bg-primary-foreground rounded-full', Platform.select({ web: 'hover:opacity-90' })),
        ghost: cn('rounded-md', Platform.select({ web: 'hover:bg-well' })),
        fab: 'bg-primary h-[52px] w-[52px] rounded-full',
      },
      size: {
        default: 'px-[30px] py-[15px]',
        sm: 'px-[18px] py-[11px]',
        chip: 'px-[14px] py-[8px]',
        block: 'w-full py-[16px]',
        icon: 'h-[34px] w-[34px] p-0',
        none: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const buttonTextVariants = cva('font-body-semibold text-[15px]', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      outline: 'text-foreground',
      pill: 'font-body-medium text-foreground text-[14px]',
      settle: 'text-white',
      onInk: 'text-foreground',
      ghost: 'text-foreground',
      fab: 'text-primary-foreground text-[26px]',
    },
    size: {
      default: '',
      sm: 'text-[14px]',
      chip: 'font-body-medium text-[12px]',
      block: 'text-[16px]',
      icon: '',
      none: '',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

type ButtonProps = React.ComponentProps<typeof Pressable> &
  React.RefAttributes<typeof Pressable> &
  VariantProps<typeof buttonVariants>;

function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <TextClassContext.Provider value={buttonTextVariants({ variant, size })}>
      <Pressable
        className={cn(
          // Disabled state from the design sheet: well fill, day-400 label.
          props.disabled && 'bg-well opacity-100',
          buttonVariants({ variant, size }),
          props.disabled && 'bg-well',
          !props.disabled && 'active:opacity-90',
          className
        )}
        role="button"
        {...props}
      />
    </TextClassContext.Provider>
  );
}

export { Button, buttonTextVariants, buttonVariants };
export type { ButtonProps };
