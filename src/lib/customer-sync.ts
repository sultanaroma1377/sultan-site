import { toast } from 'sonner';
import { store } from './store';
import { customerLogin, customerLogout, customerState, saveCustomer, adminCustomerActivity } from './customer.functions';
import type { Customer } from './types';

let applying = false;
let pending: Promise<unknown> = Promise.resolve();
let started = false;
let revision = 0;
function apply(customer: Customer, orders?: ReturnType<typeof store.get>['orders']) {
  applying = true;
  try { store.set(s => ({ ...s, customers: [customer], currentCustomerId: customer.id, orders: orders ?? s.orders })); }
  finally { applying = false; }
}
export async function signInCustomer(username: string, password: string, signup: boolean) {
  const customer = await customerLogin({ data: { username, password, signup } });
  apply(customer);
  const remote = await customerState(); apply(remote.customer, remote.orders);
}
export async function signOutCustomer() {
  await flushCustomerChanges(); await customerLogout();
  applying = true;
  try { store.set(s => ({ ...s, customers: [], orders: [], currentCustomerId: null })); }
  finally { applying = false; }
}
export async function flushCustomerChanges() { await pending; }
export async function refreshCustomer() {
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
  void refreshCustomer().catch(() => undefined);
  window.setInterval(() => { if (store.get().currentCustomerId) void pending.then(refreshCustomer).catch(() => undefined); }, 5000);
}
export async function refreshAdminActivity() {
  const remote = await adminCustomerActivity();
  applying = true;
  try { store.set(s => ({ ...s, customers: remote.customers, orders: remote.orders })); }
  finally { applying = false; }
}