import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { productRatings } from './customer.functions';
import { useStore } from './store';
import { reviewKey } from './review-rules';

type R = Record<string, { sum: number; count: number; reviews: { stars: number; text: string; createdAt: number; username?: string }[] }>;
let cache: R | null = null; let inflight: Promise<R> | null = null; const subs = new Set<(r: R) => void>();
export function reloadRatings() { inflight = productRatings().then(r => { cache = r; subs.forEach(f => f(r)); return r; }).finally(() => { inflight = null; }); return inflight; }
export function useRatings() {
  const [r, setR] = useState<R>({});
  useEffect(() => { subs.add(setR); if (cache) setR(cache); else if (!inflight) void reloadRatings().catch(() => undefined); return () => { subs.delete(setR); }; }, []);
  return r;
}
export function RatingLine({ ids, className = '' }: { ids: string[]; className?: string }) {
  const r = useRatings();
  const products = useStore(s => s.products);
  const keys = [...new Set(ids.map(id => reviewKey(products, id)))];
  const t = keys.reduce((a, id) => ({ sum: a.sum + (r[id]?.sum ?? 0), count: a.count + (r[id]?.count ?? 0) }), { sum: 0, count: 0 });
  if (!t.count) return <p className={`text-xs opacity-70 ${className}`}>No ratings yet</p>;
  const avg = t.sum / t.count;
  return <p className={`flex items-center gap-1 text-xs ${className}`} aria-label={`Rated ${avg.toFixed(1)} of 5`}>{[1, 2, 3, 4, 5].map(n => <Star key={n} className={`h-3.5 w-3.5 ${n <= Math.round(avg) ? 'fill-current' : 'opacity-40'}`} />)}<span>{avg.toFixed(1)} ({t.count})</span></p>;
}

export function ProductReviews({ productId }: { productId: string }) {
  const ratings = useRatings();
  const products = useStore(s => s.products);
  const reviews = ratings[reviewKey(products, productId)]?.reviews ?? [];
  return <section className="mt-8 border-t pt-6"><h2 className="font-serif text-2xl">Customer reviews</h2>{!reviews.length ? <p className="mt-3 text-sm text-muted-foreground">No reviews yet.</p> : <div className="mt-3 divide-y">{[...reviews].sort((a, b) => b.createdAt - a.createdAt).map((review, index) => <article key={`${review.createdAt}-${index}`} className="py-4"><p className="mb-2 break-words text-sm font-semibold">{review.username ?? 'Customer'}</p><p className="flex items-center gap-1 text-primary" aria-label={`${review.stars} of 5 stars`}>{[1, 2, 3, 4, 5].map(n => <Star key={n} className={`h-4 w-4 ${n <= review.stars ? 'fill-current' : 'opacity-40'}`} />)}</p><p className="mt-2 whitespace-pre-wrap break-words text-sm">{review.text}</p><p className="mt-2 text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</p></article>)}</div>}</section>;
}
