import { cn } from '../../../lib/utils';

// 1-on-1 bubble. Mine = right/primary, theirs = left/secondary.
export function MessageBubble({ text, mine, time }) {
  return (
    <div className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-3 py-1.5 text-sm',
          mine ? 'rounded-br-sm bg-primary text-primary-foreground' : 'rounded-bl-sm bg-secondary'
        )}
      >
        <p className="whitespace-pre-wrap break-words">{text}</p>
        {time && (
          <p className={cn('mt-0.5 text-right text-[10px]', mine ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
            {new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  );
}

export default MessageBubble;
