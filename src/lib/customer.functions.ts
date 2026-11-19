import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import type { Customer, ConfirmedOrder } from './types';
import { saveReview, summarizeReviews } from './review-rules';
import { optionalWhatsapp } from './customer-rules';

const credentials = z.object({ username: z.string().trim().min(1).max(64).regex(/^[a-zA-Z0-9_.-]+$/), password: z.string().min(6).max(128), signup: z.boolean() });
const address = z.object({ id: z.string(), line1: z.string().min(1).max(300), pincode: z.string().regex(/^\d{6}$/), state: z.string().min(1).max(100), city: z.string().min(1).max(100) });
const shopping = z.object({ favorites: z.array(z.string()).max(1000), cart: z.array(z.object({ productId: z.string(), qty: z.number().int().min(1).max(999), savedForLater: z.boolean().optional() })).max(1000), addresses: z.array(address).max(100) });

export const customerLogin = createServerFn({ method: 'POST' }).inputValidator(d => credentials.parse(d)).handler(async ({ data }) => {
  const h = await import('./customer.server');
  await h.assertWriteOrigin();
  const sb = await h.database();
  const username = data.username.toLowerCase();
  const result = await sb.from('customer_accounts').select('*').eq('username', username).maybeSingle();
  let account = result.data;
  if (data.signup) {
    if (result.data) throw new Error('Username taken');
    const inserted = await sb.from('customer_accounts').insert({ username, password_hash: await h.passwordHash(data.password) }).select('*').single();
    if (inserted.error) throw new Error('Could not create account; try another username');
    account = inserted.data;
  } else if (!account || await h.passwordHash(data.password, account.password_hash.split(':')[0]) !== account.password_hash) {
    throw new Error('Invalid username or password');
  }
  if (!account) throw new Error('Could not sign in');
  await h.issueSession(account.id);
  return { id: account.id, username: account.username, password: '', ...shopping.parse(account.data) } satisfies Customer;
});

export const customerState = createServerFn({ method: 'GET' }).handler(async () => {
  const h = await import('./customer.server');
  const session = await h.requireSession();
  const sb = await h.database();
  const { data, error } = await sb.from('customer_accounts').select('id,username,data').eq('id', session.customer_id ?? '').single();
  if (error) throw new Error('Could not load account');
  const orders = await sb.from('customer_orders').select('data').eq('customer_id', data.id);
  if (orders.error) throw new Error('Could not load orders');
  return { customer: { id: data.id, username: data.username, password: '', ...shopping.parse(data.data) } satisfies Customer, orders: orders.data.map(o => o.data as unknown as ConfirmedOrder) };
});

export const saveCustomer = createServerFn({ method: 'POST' }).inputValidator(d => shopping.parse(d)).handler(async ({ data }) => {
  const h = await import('./customer.server'); await h.assertWriteOrigin(); const session = await h.requireSession();
  const sb = await h.database();
  const { error } = await sb.from('customer_accounts').update({ data }).eq('id', session.customer_id ?? '');
  if (error) throw new Error('Customer changes not saved');
  return { ok: true };
});

export const customerLogout = createServerFn({ method: 'POST' }).handler(async () => {
  const h = await import('./customer.server'); await h.assertWriteOrigin(); await h.clearCustomerSession(); return { ok: true };
});

export const changeCustomerPassword = createServerFn({ method: 'POST' }).inputValidator(d => z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(6).max(128) }).parse(d)).handler(async ({ data }) => {
  const h = await import('./customer.server'); await h.assertWriteOrigin(); const session = await h.requireSession(); const sb = await h.database();
  const row = await sb.from('customer_accounts').select('password_hash').eq('id', session.customer_id ?? '').single();
  if (!row.data || await h.passwordHash(data.currentPassword, row.data.password_hash.split(':')[0]) !== row.data.password_hash) throw new Error('Current password is incorrect');
  const { error } = await sb.from('customer_accounts').update({ password_hash: await h.passwordHash(data.newPassword) }).eq('id', session.customer_id ?? '');
  if (error) throw new Error('Password not changed');
  await sb.from('shop_sessions').delete().eq('customer_id', session.customer_id ?? '');
  await h.issueSession(session.customer_id);
  return { ok: true };
});

export const checkoutCustomer = createServerFn({ method: 'POST' }).inputValidator(d => z.object({ address, receiverName: z.string().trim().min(1).max(100), receiverPhone: z.string().trim().regex(/^[+\d\s()-]{7,20}$/), receiverWhatsapp: optionalWhatsapp, couponCode: z.string().max(100) }).parse(d)).handler(async ({ data }) => {
  const h = await import('./customer.server'); await h.assertWriteOrigin(); const session = await h.requireSession(); const sb = await h.database();
  const customer = await sb.from('customer_accounts').select('data').eq('id', session.customer_id ?? '').single();
  const catalog = await sb.from('shop_data').select('data').eq('key', 'catalog').single();
  if (!customer.data || !catalog.data) throw new Error('Could not load checkout');
  const cart = shopping.parse(customer.data.data);
  const shop = catalog.data.data as unknown as { products: { id: string; name: string; price: number }[]; coupons: { code: string; minAmount: number; discount: number }[] };
  const items = cart.cart.filter(i => !i.savedForLater).map(i => { const p = shop.products.find(p => p.id === i.productId); if (!p) throw new Error('An item is no longer available'); return { productId: p.id, name: p.name, price: p.price, qty: i.qty }; });
  if (!items.length) throw new Error('Your cart is empty');
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const coupon = (shop.coupons ?? []).find(c => c.code.trim().toLowerCase() === data.couponCode.trim().toLowerCase() && subtotal >= Number(c.minAmount));
  let orderNo = '';
  for (let i = 0; i < 10 && !orderNo; i++) { const n = 'WS' + String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, '0'); const dup = await sb.from('customer_orders').select('id').eq('data->>orderNo', n).limit(1); if (!dup.data?.length) orderNo = n; }
  if (!orderNo) throw new Error('Could not create order number');
  const order: ConfirmedOrder = { orderNo, id: crypto.randomUUID(), customerId: session.customer_id ?? '', items, total: Math.max(0, subtotal - Number(coupon?.discount ?? 0)), address: data.address, receiverName: data.receiverName, receiverPhone: data.receiverPhone, ...(data.receiverWhatsapp ? { receiverWhatsapp: data.receiverWhatsapp } : {}), status: 'pending', createdAt: Date.now() };
  const { error } = await sb.from('customer_orders').insert({ id: order.id, customer_id: order.customerId, data: order as never });
  if (error) throw new Error('Order not placed');
  const updated = { ...cart, cart: cart.cart.filter(i => i.savedForLater), addresses: cart.addresses.some(a => a.id === data.address.id) ? cart.addresses : [...cart.addresses, data.address] };
  const saved = await sb.from('customer_accounts').update({ data: updated }).eq('id', order.customerId);
  if (saved.error) throw new Error('Order placed, but cart could not be cleared. Please reload before ordering again.');
  return order;
});

export const adminCustomerActivity = createServerFn({ method: 'GET' }).handler(async () => {
  const h = await import('./customer.server'); await h.requireSession(true); const sb = await h.database();
  const customers = await sb.from('customer_accounts').select('id,username,data').order('created_at', { ascending: false });
  const orders = await sb.from('customer_orders').select('data').order('created_at', { ascending: false });
  if (customers.error || orders.error) throw new Error('Could not load customer activity');
  return { customers: customers.data.map(c => ({ id: c.id, username: c.username, password: '', ...shopping.parse(c.data) })), orders: orders.data.map(o => o.data as unknown as ConfirmedOrder) };
});

export const updateCustomerOrder = createServerFn({ method: 'POST' }).inputValidator(d => z.object({ id: z.string().uuid(), action: z.enum(['accept', 'reject', 'dispatch', 'courier']), courierName: z.string().trim().max(100).optional(), courierNo: z.string().trim().max(100).optional() }).parse(d)).handler(async ({ data }) => {
  const h = await import('./customer.server'); await h.assertWriteOrigin(); await h.requireSession(true); const sb = await h.database();
  const row = await sb.from('customer_orders').select('data').eq('id', data.id).single();
  if (!row.data) throw new Error('Order not found');
  const cur = row.data.data as unknown as ConfirmedOrder; const now = Date.now();
  let order: ConfirmedOrder;
  if (data.action === 'accept') { if (cur.status !== 'pending' && cur.status !== 'rejected') throw new Error('Order cannot be accepted'); order = { ...cur, status: 'accepted', acceptedAt: now }; }
  else if (data.action === 'reject') { if (cur.status !== 'pending' && cur.status !== 'accepted') throw new Error('Order cannot be rejected'); order = { ...cur, status: 'rejected', rejectedAt: now }; }
  else if (data.action === 'dispatch') { if (cur.status !== 'accepted') throw new Error('Only accepted orders can be dispatched'); order = { ...cur, status: 'dispatched', dispatchedAt: now }; }
  else { if (cur.status !== 'dispatched') throw new Error('Courier details need a dispatched order'); if (!data.courierNo) throw new Error('Enter tracking number'); order = { ...cur, courierName: data.courierName || undefined, courierNo: data.courierNo }; }
  const result = await sb.from('customer_orders').update({ data: order as never }).eq('id', data.id);
  if (result.error) throw new Error('Order not updated'); return order;
});

export const rateOrderItem = createServerFn({ method: 'POST' }).inputValidator(d => z.object({ orderId: z.string().uuid(), productId: z.string().min(1), stars: z.number().int().min(1).max(5), text: z.string().trim().min(1).max(2000) }).parse(d)).handler(async ({ data }) => {
  const h = await import('./customer.server'); await h.assertWriteOrigin(); const session = await h.requireSession(); const sb = await h.database();
  const row = await sb.from('customer_orders').select('data').eq('id', data.orderId).eq('customer_id', session.customer_id ?? '').single();
  if (!row.data) throw new Error('Order not found');
  const cur = row.data.data as unknown as ConfirmedOrder;
  const catalog = await sb.from('shop_data').select('data').eq('key', 'catalog').single();
  if (catalog.error) throw new Error('Could not load perfumes');
  const products = (catalog.data.data as unknown as { products: import('./types').Product[] }).products;
  const order = saveReview(cur, products, data.productId, data.stars, data.text);
  const r = await sb.from('customer_orders').update({ data: order as never }).eq('id', data.orderId);
  if (r.error) throw new Error('Rating not saved'); return order;
});

export const productRatings = createServerFn({ method: 'GET' }).handler(async () => {
  const h = await import('./customer.server'); const sb = await h.database();
  const { data, error } = await sb.from('customer_orders').select('data');
  if (error) throw new Error('Could not load ratings');
  const catalog = await sb.from('shop_data').select('data').eq('key', 'catalog').single();
  if (catalog.error) throw new Error('Could not load perfumes');
  return summarizeReviews(data.map(row => row.data as unknown as ConfirmedOrder), (catalog.data.data as unknown as { products: import('./types').Product[] }).products);
});
