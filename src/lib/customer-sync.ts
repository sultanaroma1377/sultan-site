import { toast } from 'sonner';
import { store } from './store';
import { customerLogin, customerLogout, customerState, saveCustomer, adminCustomerActivity } from './customer.functions';
import type { Customer } from './types';
import { supabase } from '@/integrations/supabase/client';
import { connectCloudCustomer } from './customer-auth.functions';

let applying = false;
let pending: Promise<unknown> = Promise.resolve();
let started = false;
let revision = 0;
function apply(customer: Customer, orders?: ReturnType<typeof store.get>['orders']) {
  const cur = store.get();
  if (cur.currentCustomerId === customer.id && JSON.stringify(cur.customers) === JSON.stringify([customer]) && (!orders || JSON.stringify(cur.orders) === JSON.stringify(orders))) return;
  applying = true;
  try { store.set(s => ({ ...s, customers: [customer], currentCustomerId: customer.id, orders: orders ?? s.orders })); }
  finally { applying = false; }
}
export async function signInCustomer(username: string, password: string, signup: boolean) {
  await flushCustomerChanges();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  const customer = await customerLogin({ data: { username, password, signup } });
  apply(customer, []);
  const remote = await customerState(); apply(remote.customer, remote.orders);
}
export async function signOutCustomer() {
  await flushCustomerChanges(); await customerLogout();
  await supabase.auth.signOut();
  applying = true;
  try { store.set(s => ({ ...s, customers: [], orders: [], currentCustomerId: null })); }
  finally { applying = false; }
}
let connecting: Promise<void> | null = null;
export function syncCloudCustomer() {
  if (connecting) return connecting;
  connecting = (async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return;
    await flushCustomerChanges();
    const customer = await connectCloudCustomer();
    apply(customer, store.get().currentCustomerId === customer.id ? store.get().orders : []);
    await refreshCustomer();
  })().finally(() => { connecting = null; });
  return connecting;
}
export async function flushCustomerChanges() { await pending; }
export async function refreshCustomer() {
  if (location.pathname.startsWith('/admin')) return;
  const version = revision;
  const remote = await customerState();
  if (version === revision) apply(remote.customer, remote.orders);
}
export function startCustomerSync() {
  if (started) return; started = true;
  let last = store.get().customers;
  store.subscribe(() => {
    const s = store.get();
    const current = s.customers.find(c => c.id === s.currentCustomerId);
    const changed = s.customers !== last; last = s.customers;
    if (applying || !changed || !current) return;
    revision++;
    const data = { favorites: current.favorites, cart: current.cart, addresses: current.addresses };
    pending = pending.catch(() => undefined).then(() => saveCustomer({ data }));
    void pending.catch(() => toast.error('Customer changes not saved online. Please try again.'));
  });
  void syncCloudCustomer().then(refreshCustomer).catch(() => undefined);
  window.setInterval(() => { if (store.get().currentCustomerId) void pending.then(refreshCustomer).catch(() => undefined); }, 5000);
}
export async function refreshAdminActivity() {
  const remote = await adminCustomerActivity();
  const s0 = store.get();
  if (JSON.stringify(s0.customers) === JSON.stringify(remote.customers) && JSON.stringify(s0.orders) === JSON.stringify(remote.orders)) return;
  applying = true;
  try { store.set(s => ({ ...s, customers: remote.customers, orders: remote.orders })); }
  finally { applying = false; }
}