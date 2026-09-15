import { MapPin } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { useDeleteItem } from '../hooks/useLostFound';
import { resolveImageUrl } from '../api/lostFoundApi';
import { Modal } from './Modal';

export function ItemDetailModal({ item, open, onClose, canModerate, onMessageFinder }) {
  const del = useDeleteItem();

  if (!item) return null;
  const location = item.location || item.locationFound;
  // Reporter semantics: a 'lost' post is by the OWNER, a 'found' post is by the FINDER.
  const contactLabel = item.type === 'lost' ? 'Message Owner' : 'Message Finder';

  const remove = () => {
    if (!window.confirm('Delete this item?')) return;
    del.mutate(item._id, { onSuccess: () => onClose?.() });
  };

  return (
    <Modal open={open} onClose={onClose} label={item.title} className="max-w-xl">
      <div className="space-y-4">
        {item.imageUrl && (
          <img src={resolveImageUrl(item.imageUrl)} alt={item.title} className="max-h-64 w-full rounded-md object-cover" />
        )}
        <div className="flex flex-wrap gap-1.5">
          <Badge variant={item.type === 'lost' ? 'destructive' : 'default'}>{item.type}</Badge>
          <Badge variant="outline">{item.category?.replace('_', ' ')}</Badge>
          <Badge variant="secondary">{item.status}</Badge>
        </div>
        <p className="text-sm">{item.description}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {location && <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{location}</span>}
          {item.date && <span>{new Date(item.date).toLocaleString()}</span>}
          {item.reportedBy?.name && <span>by {item.reportedBy.name}{item.reportedBy.usn ? ` (${item.reportedBy.usn})` : ''}</span>}
        </div>

        <div className="flex flex-wrap gap-2">
          {onMessageFinder && (
            <Button onClick={() => { onMessageFinder(item); onClose?.(); }}>
              {contactLabel}
            </Button>
          )}
          {canModerate && (
            <Button variant="destructive" onClick={remove} disabled={del.isPending}>
              {del.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
