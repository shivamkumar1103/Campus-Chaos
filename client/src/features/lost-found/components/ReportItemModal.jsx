import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { LOST_FOUND_CATEGORIES, LOST_FOUND_TYPES } from '../api/lostFoundApi';
import { useReportItem } from '../hooks/useLostFound';
import { Modal } from './Modal';
import { cn } from '../../../lib/utils';

const selectCls =
  'brutal-flat h-11 w-full cursor-pointer bg-paper px-3 font-mono text-[11px] font-bold uppercase tracking-widest text-ink dark:bg-void dark:text-cream';

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
    <Modal open={open} onClose={onClose} label="Report lost / found">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {LOST_FOUND_TYPES.map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => setForm({ ...form, type: t })}
              className={cn(
                'brutal-sm cursor-pointer py-2.5 font-display text-sm font-extrabold tracking-widest uppercase',
                form.type === t
                  ? t === 'lost' ? 'bg-hyper text-white' : 'bg-mint text-ink'
                  : 'bg-paper text-ink hover:bg-sun dark:bg-void dark:text-cream'
              )}
            >
              {t === 'lost' ? '✦ Lost' : '⬣ Found'}
            </button>
          ))}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lf-title">Title</Label>
          <Input id="lf-title" value={form.title} onChange={set('title')} placeholder="e.g. LOST HP CHARGER — ROOM 302" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="hidden">
            <select value={form.type} onChange={set('type')}>
              {LOST_FOUND_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Category</Label>
            <select className={selectCls} value={form.category} onChange={set('category')}>
              {LOST_FOUND_CATEGORIES.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
            </select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lf-location">Location</Label>
          <Input id="lf-location" value={form.location} onChange={set('location')} placeholder="ROOM 302 / LAB 4 ..." />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lf-desc">Description</Label>
          <Textarea id="lf-desc" value={form.description} onChange={set('description')} placeholder="COLOUR, BRAND, IDENTIFYING MARKS..." required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lf-image">Photo (optional)</Label>
          <Input id="lf-image" type="file" accept="image/*" onChange={onFile} />
          {preview && <img src={preview} alt="Preview" className="brutal h-32 w-full object-cover" />}
        </div>
        {error && <p className="brutal-sm bg-hyper p-2 text-sm font-bold text-white">{error}</p>}
        <Button className="w-full" size="lg" disabled={report.isPending}>
          {report.isPending ? 'Posting...' : 'Post to the board →'}
        </Button>
      </form>
    </Modal>
  );
}
