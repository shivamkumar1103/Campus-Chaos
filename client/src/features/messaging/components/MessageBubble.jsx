import { cn } from '../../../lib/utils';

// 1-on-1 bubble. Mine = acid/right, theirs = paper/left. Hard borders, snappy hover.
export function MessageBubble({ text, mine, time }) {
  return (
    <div className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[78%] border-2 border-[var(--ink-line)] px-3 py-1.5 text-sm font-medium transition-transform hover:scale-[1.02]',
          mine
            ? 'rounded-br-none bg-acid text-obsidian shadow-[3px_3px_0_0_#000]'
            : 'rounded-bl-none bg-paper text-ink shadow-[3px_3px_0_0_var(--shadow-color)] dark:bg-void dark:text-cream'
        )}
      >
        <p className="whitespace-pre-wrap break-words">{text}</p>
        {time && (
          <p className={cn('mt-0.5 text-right font-mono text-[10px] font-bold', mine ? 'text-obsidian/60' : 'opacity-60')}>
            {new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  );
}

export default MessageBubble;
