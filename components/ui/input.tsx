import { Platform, TextInput, type TextInputProps } from 'react-native';

import { cn } from '@/lib/utils';

/** Field from the Landfall design canvas (artboard 1b, "Inputs"). */
function Input({
  className,
  placeholderClassName,
  ...props
}: TextInputProps &
  React.RefAttributes<TextInput> & {
    placeholderClassName?: string;
  }) {
  return (
    <TextInput
      className={cn(
        'border-input bg-card text-foreground font-body rounded-md border px-4 py-[15px] text-[15px]',
        props.editable === false && 'opacity-50',
        Platform.select({
          web: 'placeholder:text-subtle outline-none focus-visible:border-foreground',
          native: 'placeholder:text-subtle',
        }),
        className
      )}
      placeholderClassName={cn('text-subtle', placeholderClassName)}
      {...props}
    />
  );
}

export { Input };
