import { createFileRoute, Link } from '@tanstack/react-router';
import { UserHeader } from '@/components/UserHeader';
import { UserFooter } from '@/components/UserFooter';
import { useStore } from '@/lib/store';
import { ownOrders } from '@/lib/customer-rules';
import { Copy, Star } from 'lucide-react';
import { toast } from 'sonner';
import { rateOrderItem } from '@/lib/customer.functions';
import { refreshCustomer } from '@/lib/customer-sync';
import { reloadRatings } from '@/lib/ratings';

const copy = (t: string) => { void navigator.clipboard.writeText(t).then(() => toast.success('Tracking number copied')).catch(() => window.prompt('Copy tracking number', t)); };
const rate = (orderId: string, productId: string, stars: number) => { void rateOrderItem({ data: { orderId, productId, stars } }).then(() => Promise.all([refreshCustomer(), reloadRatings()])).then(() => toast.success('Thanks for rating!')).catch((e: Error) => toast.error(e.message)); };

export const Route = createFileRoute('/orders')({ component: OrdersPage, head: () => ({ meta: [
  { title: 'Your orders — SULTAN AL MISK' }, { name: 'description', content: 'View your checked-out SULTAN AL MISK orders and acceptance status.' },
  { property: 'og:title', content: 'Your orders — SULTAN AL MISK' }, { property: 'og:description', content: 'Your perfume orders, delivery details and status.' },
  { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
] }) });

function OrdersPage() {
  const id = useStore(s => s.currentCustomerId);
  const orders = useStore(s => s.orders);
  const mine = ownOrders(orders, id ?? '');
  return <div className="min-h-screen"><UserHeader /><main className="mx-auto max-w-3xl px-4 py-12 md:px-6"><Link to="/account" className="text-sm text-primary">← Account details</Link><h1 className="mt-6 font-serif text-4xl">Your orders</h1>
    {!id ? <p className="mt-6 text-muted-foreground">Please login to view your orders.</p> : !mine.length ? <p className="mt-6 text-muted-foreground">No checked-out orders yet.</p> : <div className="mt-8 space-y-5">{mine.map(o => <article key={o.id} className="rounded-lg border bg-card p-5"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-serif text-xl">Order #{o.orderNo ?? o.id.slice(0, 8)}</h2><span className="text-sm font-medium text-primary">{({ pending: 'Awaiting acceptance', accepted: 'Accepted — you will be informed to pay', rejected: 'Rejected', dispatched: 'Dispatched' } as const)[o.status]}</span></div><p className="mt-1 text-sm text-muted-foreground">{new Date(o.createdAt).toLocaleString()}</p>{o.status === 'dispatched' && (o.courierNo ? <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md border-2 border-primary bg-primary/10 p-3 text-sm"><span className="font-semibold text-primary">Tracking</span>{o.courierName && <span>{o.courierName} ·</span>}<strong className="font-mono text-base">{o.courierNo}</strong><button type="button" onClick={() => copy(o.courierNo!)} className="ml-auto inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground"><Copy className="h-3.5 w-3.5" />Copy</button></div> : <p className="mt-2 text-sm">Tracking details will be added soon.</p>)}<ul className="my-5 divide-y">{o.items.map(i => <li key={i.productId} className="flex justify-between gap-3 py-3"><div><Link to="/product/$id" params={{ id: i.productId }}>{i.name} × {i.qty}</Link>{o.status === 'dispatched' && <div className="mt-1 flex items-center gap-0.5" aria-label="Rate this product">{[1, 2, 3, 4, 5].map(n => <button key={n} type="button" aria-label={`${n} star`} onClick={() => rate(o.id, i.productId, n)}><Star className={`h-4 w-4 text-primary ${n <= (o.ratings?.[i.productId] ?? 0) ? 'fill-current' : ''}`} /></button>)}<span className="ml-1 text-xs text-muted-foreground">{o.ratings?.[i.productId] ? 'Your rating' : 'Rate'}</span></div>}</div><span>₹{(i.price * i.qty).toLocaleString('en-IN')}</span></li>)}</ul><div className="flex justify-between font-medium"><span>Total</span><span>₹{o.total.toLocaleString('en-IN')}</span></div><div className="mt-5 border-t pt-4 text-sm"><p>{o.receiverName} · {o.receiverPhone}</p><p className="mt-1 text-muted-foreground">{o.address.line1}, {o.address.city}, {o.address.state} — {o.address.pincode}</p></div></article>)}</div>}
  </main><UserFooter /></div>;
}