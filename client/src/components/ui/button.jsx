import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

/**
 * Maximalist brutal buttons.
 * Default = invert-on-hover. Active = pressed (shadow collapses).
 * Focus = 3px hyper/acid outline (see index.css).
 */
const buttonVariants = cva(
  'brutal-sm invert-hover inline-flex cursor-pointer items-center justify-center gap-2 font-display text-[13px] font-extrabold tracking-[0.08em] whitespace-nowrap uppercase disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-acid text-obsidian hover:bg-hyper hover:text-white dark:bg-acid dark:text-obsidian dark:hover:bg-hyper dark:hover:text-white',
        hyper: 'bg-hyper text-white hover:bg-ink hover:text-cream dark:hover:bg-acid dark:hover:text-obsidian',
        cobalt: 'bg-cobalt text-white hover:bg-tang',
        tang: 'bg-tang text-white hover:bg-acid hover:text-obsidian',
        sun: 'bg-sun text-ink hover:bg-ink hover:text-cream dark:hover:bg-hyper dark:hover:text-white',
        ink: 'bg-ink text-cream hover:bg-hyper hover:text-white dark:bg-cream dark:text-ink dark:hover:bg-hyper dark:hover:text-white',
        paper: 'bg-paper text-ink hover:bg-hyper hover:text-white dark:bg-void dark:text-cream',
        outline: 'bg-transparent hover:bg-acid hover:text-obsidian',
        ghost: 'border-transparent shadow-none hover:bg-sun hover:text-ink',
        destructive: 'bg-hyper text-white hover:bg-ink hover:text-cream',
        link: 'border-0 shadow-none underline underline-offset-4 hover:bg-transparent hover:text-hyper',
      },
      size: {
        default: 'px-4 py-2.5',
        sm: 'px-3 py-1.5 text-xs',
        lg: 'px-7 py-3.5 text-sm',
        icon: 'size-10 p-0',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = 'Button';

export { Button, buttonVariants };
