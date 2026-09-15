import * as React from 'react';
import { cn } from '../../lib/utils';

const Input = React.forwardRef(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      'brutal-flat flex h-11 w-full bg-paper px-3 py-1 text-sm font-medium text-ink placeholder:font-mono placeholder:text-[11px] placeholder:tracking-widest placeholder:uppercase placeholder:text-ink/45 hover:bg-sun/20 focus:bg-sun/30 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-void dark:text-cream dark:placeholder:text-cream/40 dark:hover:bg-grape dark:focus:bg-grape',
      className
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = 'Input';

export { Input };
