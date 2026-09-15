import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 border-2 px-2 py-0.5 font-mono text-[10px] font-bold tracking-[0.14em] uppercase transition-all hover:-translate-y-px hover:scale-[1.04]',
  {
    variants: {
      variant: {
        default: 'border-current bg-acid text-obsidian',
        hyper: 'border-current bg-hyper text-white',
        cobalt: 'border-current bg-cobalt text-white',
        tang: 'border-current bg-tang text-white',
        sun: 'border-current bg-sun text-ink',
        mint: 'border-current bg-mint text-ink',
        ink: 'border-current bg-ink text-cream dark:bg-cream dark:text-ink',
        secondary: 'border-current bg-transparent',
        destructive: 'border-current bg-hyper text-white',
        outline: 'border-current bg-transparent',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), 'border-[var(--ink-line)]', className)} {...props} />;
}

export { Badge, badgeVariants };
