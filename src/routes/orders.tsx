import { createFileRoute, Link } from '@tanstack/react-router';
import { UserHeader } from '@/components/UserHeader';
import { UserFooter } from '@/components/UserFooter';
import { useStore } from '@/lib/store';
import { ownOrders } from '@/lib/customer-rules';

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
    {!id ? <p className="mt-6 text-muted-foreground">Please login to view your orders.</p> : !mine.length ? <p className="mt-6 text-muted-foreground">No checked-out orders yet.</p> : <div className="mt-8 space-y-5">{mine.map(o => <article key={o.id} className="rounded-lg border bg-card p-5"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-serif text-xl">Order #{o.id.slice(0, 8)}</h2><span className="text-sm font-medium text-primary">{o.status === 'accepted' ? 'Accepted' : 'Awaiting acceptance'}</span></div><p className="mt-1 text-sm text-muted-foreground">{new Date(o.createdAt).toLocaleString()}</p><ul className="my-5 divide-y">{o.items.map(i => <li key={i.productId} className="flex justify-between gap-3 py-3"><Link to="/product/$id" params={{ id: i.productId }}>{i.name} × {i.qty}</Link><span>₹{(i.price * i.qty).toLocaleString('en-IN')}</span></li>)}</ul><div className="flex justify-between font-medium"><span>Total</span><span>₹{o.total.toLocaleString('en-IN')}</span></div><div className="mt-5 border-t pt-4 text-sm"><p>{o.receiverName} · {o.receiverPhone}</p><p className="mt-1 text-muted-foreground">{o.address.line1}, {o.address.city}, {o.address.state} — {o.address.pincode}</p></div></article>)}</div>}
  </main><UserFooter /></div>;
}