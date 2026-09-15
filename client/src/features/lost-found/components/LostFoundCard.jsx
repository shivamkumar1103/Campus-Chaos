import { MapPin } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { useTilt } from '../../../components/design/kinetic';
import { resolveImageUrl } from '../api/lostFoundApi';
import { cn } from '../../../lib/utils';

export function LostFoundCard({ item, onOpen }) {
  const { ref, onPointerMove, onPointerLeave } = useTilt(8);
  const reporter = item.reportedBy?.name ?? 'Unknown';
  const location = item.location || item.locationFound;
  const date = item.date ? new Date(item.date).toLocaleDateString() : '';
  const lost = item.type === 'lost';

  return (
    <article
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onClick={() => onOpen?.(item)}
      onKeyDown={(e) => e.key === 'Enter' && onOpen?.(item)}
      tabIndex={0}
      role="button"
      aria-label={item.title}
      className={cn(
        'brutal tilt-card group cursor-pointer overflow-hidden bg-paper text-ink brutal-hover dark:bg-obsidian dark:text-cream',
        lost ? 'hover:bg-sun/30' : 'hover:bg-mint/20'
      )}
    >
      {item.imageUrl && (
        <div className="relative border-b-[3px] border-[var(--ink-line)]">
          <img src={resolveImageUrl(item.imageUrl)} alt={item.title} className="h-44 w-full object-cover transition-transform duration-200 group-hover:scale-[1.04]" loading="lazy" />
          <span className={cn(
            'brutal-flat absolute top-2 left-2 px-2 py-0.5 font-display text-xs font-extrabold tracking-widest uppercase',
            lost ? 'bg-hyper text-white -rotate-2' : 'bg-mint text-ink rotate-2'
          )}>
            {item.type}
          </span>
          <span className="brutal-flat absolute top-2 right-2 bg-ink px-2 py-0.5 font-mono text-[10px] font-bold text-cream uppercase">{item.status}</span>
        </div>
      )}
      <div className="space-y-2 p-4">
        <div className="flex flex-wrap gap-1.5">
          {!item.imageUrl && (
            <Badge variant={lost ? 'destructive' : 'mint'}>{item.type}</Badge>
          )}
          <Badge variant="secondary">{item.category?.replace('_', ' ')}</Badge>
          {!item.imageUrl && <Badge variant="ink">{item.status}</Badge>}
        </div>
        <h3 className="font-display text-[17px] leading-tight font-extrabold uppercase group-hover:underline group-hover:decoration-hyper group-hover:decoration-[3px] group-hover:underline-offset-4">{item.title}</h3>
        <p className="line-clamp-2 text-[13px] leading-snug font-medium opacity-75">{item.description}</p>
        <div className="flex items-center justify-between border-t-2 border-dashed border-[var(--ink-line)] pt-2 font-mono text-[10px] font-bold tracking-widest uppercase opacity-80">
          <span className="inline-flex items-center gap-1">
            {location && <><MapPin className="size-3" /> {location}</>}
          </span>
          <span>{date}</span>
        </div>
        <p className="font-mono text-[10px] tracking-widest uppercase opacity-60">✦ by {reporter}</p>
      </div>
    </article>
  );
}
