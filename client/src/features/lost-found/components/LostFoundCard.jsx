import { MapPin } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { resolveImageUrl } from '../api/lostFoundApi';

const typeVariant = (type) => (type === 'lost' ? 'destructive' : 'default');
const statusVariant = (status) => (status === 'open' ? 'secondary' : 'outline');

export function LostFoundCard({ item, onOpen }) {
  const reporter = item.reportedBy?.name ?? 'Unknown';
  const location = item.location || item.locationFound;
  const date = item.date ? new Date(item.date).toLocaleDateString() : '';

  return (
    <Card className="cursor-pointer overflow-hidden transition-shadow hover:shadow-md" onClick={() => onOpen?.(item)}>
      {item.imageUrl && (
        <img src={resolveImageUrl(item.imageUrl)} alt={item.title} className="h-40 w-full object-cover" loading="lazy" />
      )}
      <CardContent className="space-y-2 p-4">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant={typeVariant(item.type)}>{item.type}</Badge>
          <Badge variant="outline">{item.category?.replace('_', ' ')}</Badge>
          <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
        </div>
        <h3 className="font-semibold leading-snug">{item.title}</h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            {location && <><MapPin className="size-3" /> {location}</>}
          </span>
          <span>{date}</span>
        </div>
        <p className="text-xs text-muted-foreground">by {reporter}</p>
      </CardContent>
    </Card>
  );
}
