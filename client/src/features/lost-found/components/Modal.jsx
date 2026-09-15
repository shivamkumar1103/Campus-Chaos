import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../../lib/utils';

// Minimal shadcn-style modal (fixed overlay + panel). No extra deps.
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <div
        className={cn('max-h-[90vh] w-full max-w-lg overflow-auto rounded-xl border bg-background p-6 shadow-lg', className)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold leading-none tracking-tight">{label}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded p-1 hover:bg-accent">
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
