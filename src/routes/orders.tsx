import { createFileRoute, Link } from '@tanstack/react-router';
import { UserHeader } from '@/components/UserHeader';
import { UserFooter } from '@/components/UserFooter';
import { useStore } from '@/lib/store';
import { ownOrders } from '@/lib/customer-rules';
import { CustomerOrder } from '@/components/CustomerOrder';

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
    {!id ? <p className="mt-6 text-muted-foreground">Please login to view your orders.</p> : !mine.length ? <p className="mt-6 text-muted-foreground">No checked-out orders yet.</p> : <div className="mt-8 space-y-5">{mine.map(order => <CustomerOrder key={order.id} order={order} />)}</div>}
  </main><UserFooter /></div>;
}