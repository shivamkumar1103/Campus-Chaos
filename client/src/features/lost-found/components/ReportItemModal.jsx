import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { LOST_FOUND_CATEGORIES, LOST_FOUND_TYPES } from '../api/lostFoundApi';
import { useReportItem } from '../hooks/useLostFound';
import { Modal } from './Modal';

export function ReportItemModal({ open, onClose, onReported }) {
  const report = useReportItem();
  const [form, setForm] = useState({ title: '', description: '', type: 'lost', category: 'other', location: '' });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const error = report.error?.response?.data?.message;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const onFile = (e) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : '');
  };

  const submit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (file) fd.append('image', file);
    report.mutate(fd, {
      onSuccess: (item) => {
        setForm({ title: '', description: '', type: 'lost', category: 'other', location: '' });
        setFile(null);
        setPreview('');
        onReported?.(item);
        onClose?.();
      },
    });
  };

  return (
    <Modal open={open} onClose={onClose} label="Report lost / found item">
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="lf-title">Title</Label>
          <Input id="lf-title" value={form.title} onChange={set('title')} placeholder="e.g. Lost HP charger in Room 302" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Type</Label>
            <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm" value={form.type} onChange={set('type')}>
              {LOST_FOUND_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm" value={form.category} onChange={set('category')}>
              {LOST_FOUND_CATEGORIES.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="lf-location">Location</Label>
          <Input id="lf-location" value={form.location} onChange={set('location')} placeholder="Room 302 / Lab 4 ..." />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lf-desc">Description</Label>
          <Textarea id="lf-desc" value={form.description} onChange={set('description')} placeholder="Colour, brand, identifying marks..." required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lf-image">Photo (optional)</Label>
          <Input id="lf-image" type="file" accept="image/*" onChange={onFile} />
          {preview && <img src={preview} alt="Preview" className="h-32 w-full rounded-md object-cover" />}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button className="w-full" disabled={report.isPending}>
          {report.isPending ? 'Posting...' : 'Post item'}
        </Button>
      </form>
    </Modal>
  );
}
