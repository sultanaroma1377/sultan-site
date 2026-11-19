import { useState } from 'react';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { rateOrderItem } from '@/lib/customer.functions';
import { refreshCustomer } from '@/lib/customer-sync';
import { reloadRatings } from '@/lib/ratings';
import { reviewKey } from '@/lib/review-rules';
import { useStore } from '@/lib/store';
import type { ConfirmedOrder } from '@/lib/types';

export function OrderReview({ order, productId, name }: { order: ConfirmedOrder; productId: string; name: string }) {
  const products = useStore(s => s.products);
  const existing = order.reviews?.[reviewKey(products, productId)];
  const [open, setOpen] = useState(false);
  const [stars, setStars] = useState(0);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  if (order.status !== 'dispatched') return null;
  return <div className="mt-2"><Button size="sm" variant="outline" onClick={() => { setStars(existing?.stars ?? order.ratings?.[productId] ?? 0); setText(existing?.text ?? ''); setOpen(true); }}>{existing ? 'Edit review' : 'Add review'}</Button>{existing && <p className="mt-2 break-words text-xs text-muted-foreground">{existing.stars}/5 · {existing.text}</p>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{existing ? 'Edit review' : 'Add review'} — {products.find(p => p.id === productId)?.baseName ?? name}</DialogTitle></DialogHeader><form className="space-y-4" onSubmit={async e => { e.preventDefault(); if (!stars || saving) return; setSaving(true); try { await rateOrderItem({ data: { orderId: order.id, productId, stars, text } }); await Promise.all([refreshCustomer(), reloadRatings()]); toast.success('Review submitted'); setOpen(false); } catch (error) { toast.error(error instanceof Error ? error.message : 'Review not saved'); } finally { setSaving(false); } }}><fieldset><legend className="mb-2 text-sm font-medium">Stars</legend><div className="flex gap-1">{[1, 2, 3, 4, 5].map(n => <Button key={n} type="button" size="icon" variant="ghost" aria-label={`${n} star${n === 1 ? '' : 's'}`} aria-pressed={n === stars} disabled={saving} onClick={() => setStars(n)}><Star className={`h-6 w-6 text-primary ${n <= stars ? 'fill-current' : ''}`} /></Button>)}</div></fieldset><div><label htmlFor="review-text" className="mb-2 block text-sm font-medium">Review</label><textarea id="review-text" className="min-h-28 w-full rounded-md border bg-background p-3 text-sm" maxLength={2000} required value={text} onChange={e => setText(e.target.value)} disabled={saving} /></div><Button type="submit" disabled={!stars || !text.trim() || saving}>{saving ? 'Submitting…' : 'Submit review'}</Button></form></DialogContent></Dialog>
  </div>;
}