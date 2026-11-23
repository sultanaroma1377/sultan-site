import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Check, ChevronDown, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { OrderReview } from './OrderReview';
import type { ConfirmedOrder } from '@/lib/types';

const datetime = (value: number) => new Date(value).toLocaleString();
export function CustomerOrder({ order }: { order: ConfirmedOrder }) {
  const [open, setOpen] = useState(false);
  const detailsId = `order-${order.id}`;
  const steps = [
    { label: 'Confirmed', date: order.createdAt, done: true },
    { label: 'Accepted', date: order.acceptedAt, done: order.status === 'accepted' || order.status === 'dispatched' || Boolean(order.acceptedAt) },
    { label: 'Dispatched', date: order.dispatchedAt, done: order.status === 'dispatched' },
  ];
  return <article className="order-card overflow-hidden rounded-lg border bg-card text-card-foreground">
    <Button variant="ghost" className="h-auto w-full justify-between gap-4 whitespace-normal rounded-none px-5 py-5 text-left text-foreground hover:bg-transparent hover:text-foreground" aria-expanded={open} aria-controls={detailsId} onClick={() => setOpen(value => !value)}>
      <span className="min-w-0 space-y-2">
        <span className="block font-serif text-xl">Order #{order.orderNo ?? order.id.slice(0, 8)}</span>
        <span className="block text-xs font-normal text-muted-foreground">{datetime(order.createdAt)}</span>
        <span className="block break-words text-sm font-medium">{order.receiverName} · {order.receiverPhone}</span>
        {order.receiverWhatsapp && <span className="block text-sm font-normal">WhatsApp: {order.receiverWhatsapp}</span>}
        <span className="block break-words text-sm font-normal text-muted-foreground">{order.address.line1}, {order.address.city}, {order.address.state} — {order.address.pincode}</span>
      </span>
      <ChevronDown className={`h-5 w-5 shrink-0 text-primary transition-transform motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} />
    </Button>
    {open && <div id={detailsId} className="border-t p-5">
      <ol aria-label="Order progress" className="mb-6">
        {steps.map((step, index) => <li key={step.label} className="relative flex gap-4 pb-6 last:pb-0">
          {index < 2 && <span aria-hidden className={`absolute bottom-0 left-4 top-8 w-px ${steps[index + 1]?.done ? 'bg-primary' : 'bg-border'}`} />}
          <span className={`relative grid h-8 w-8 shrink-0 place-items-center rounded-full border text-sm font-medium ${step.done ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-muted text-muted-foreground'}`}>{step.done ? <Check className="h-4 w-4" /> : index + 1}</span>
          <div className="pt-1"><p className={step.done ? 'font-semibold text-primary' : 'font-medium text-muted-foreground'}>{index + 1}. {step.label}</p><p className="mt-1 text-xs text-muted-foreground">{step.date ? datetime(step.date) : 'Awaiting update'}</p></div>
        </li>)}
      </ol>
      {order.status === 'rejected' && <p className="mb-5 text-sm font-medium text-destructive">Order rejected{order.rejectedAt ? ` · ${datetime(order.rejectedAt)}` : ''}</p>}
      {order.status === 'accepted' && <p className="mb-5 text-sm text-primary">Accepted — you will be informed to pay.</p>}
      {order.status === 'dispatched' && (order.courierNo ? <div className="mb-5 flex flex-wrap items-center gap-2 rounded-md border-2 border-primary bg-primary/10 p-3 text-sm">
        <span className="font-semibold text-primary">Tracking</span>{order.courierName && <span>{order.courierName} ·</span>}<strong className="break-all font-mono text-base">{order.courierNo}</strong>
        <Button size="sm" className="ml-auto" onClick={() => { void navigator.clipboard.writeText(order.courierNo ?? '').then(() => toast.success('Tracking number copied')).catch(() => window.prompt('Copy tracking number', order.courierNo)); }}><Copy className="h-3.5 w-3.5" />Copy</Button>
      </div> : <p className="mb-5 text-sm">Tracking details will be added soon.</p>)}
      <ul className="divide-y">{order.items.map(item => <li key={item.productId} className="flex justify-between gap-3 py-3"><div className="min-w-0"><Link to="/product/$id" params={{ id: item.productId }} className="break-words text-sm font-medium hover:underline">{item.name} × {item.qty}</Link><OrderReview order={order} productId={item.productId} name={item.name} /></div><span className="shrink-0 text-sm">₹{(item.price * item.qty).toLocaleString('en-IN')}</span></li>)}</ul>
      <div className="mt-4 flex justify-between border-t pt-4 font-semibold"><span>Total</span><span>₹{order.total.toLocaleString('en-IN')}</span></div>
    </div>}
  </article>;
}