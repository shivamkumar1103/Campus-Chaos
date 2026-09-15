import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../../lib/utils';

export function Modal({ open, onClose, children, className, label }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-[2px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <div
        className={cn('brutal-lg max-h-[90vh] w-full max-w-lg overflow-auto bg-paper p-0 text-ink dark:bg-obsidian dark:text-cream', className)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 border-b-[3px] border-[var(--ink-line)] bg-acid p-4 text-obsidian">
          <h2 className="font-display text-base leading-none font-extrabold tracking-tight uppercase">{label}</h2>
          <button onClick={onClose} aria-label="Close" className="brutal-flat cursor-pointer bg-ink p-1.5 text-cream hover:bg-hyper hover:text-white">
            <X className="size-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
