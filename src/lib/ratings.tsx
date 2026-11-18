import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { productRatings } from './customer.functions';

type R = Record<string, { sum: number; count: number }>;
let cache: R | null = null; let inflight: Promise<R> | null = null; const subs = new Set<(r: R) => void>();
export function reloadRatings() { inflight = productRatings().then(r => { cache = r; subs.forEach(f => f(r)); return r; }).finally(() => { inflight = null; }); return inflight; }
export function useRatings() {
  const [r, setR] = useState<R>(cache ?? {});
  useEffect(() => { subs.add(setR); if (!cache && !inflight) void reloadRatings().catch(() => undefined); return () => { subs.delete(setR); }; }, []);
  return r;
}
export function RatingLine({ ids, className = '' }: { ids: string[]; className?: string }) {
  const r = useRatings();
  const t = ids.reduce((a, id) => ({ sum: a.sum + (r[id]?.sum ?? 0), count: a.count + (r[id]?.count ?? 0) }), { sum: 0, count: 0 });
  if (!t.count) return <p className={`text-xs opacity-70 ${className}`}>No ratings yet</p>;
  const avg = t.sum / t.count;
  return <p className={`flex items-center gap-1 text-xs ${className}`} aria-label={`Rated ${avg.toFixed(1)} of 5`}>{[1, 2, 3, 4, 5].map(n => <Star key={n} className={`h-3.5 w-3.5 ${n <= Math.round(avg) ? 'fill-current' : 'opacity-40'}`} />)}<span>{avg.toFixed(1)} ({t.count})</span></p>;
}
