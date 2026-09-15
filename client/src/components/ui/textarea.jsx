import * as React from 'react';
import { cn } from '../../lib/utils';

const Textarea = React.forwardRef(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      'brutal-flat flex min-h-[96px] w-full bg-paper px-3 py-2 text-sm font-medium text-ink placeholder:text-ink/45 hover:bg-sun/20 focus:bg-sun/30 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-void dark:text-cream dark:placeholder:text-cream/40',
      className
    )}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

export { Textarea };
