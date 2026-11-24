import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { UserHeader } from '@/components/UserHeader';
import { UserFooter } from '@/components/UserFooter';
import { Button } from '@/components/ui/button';
import { store, useStore } from '@/lib/store';
import { changeCustomerPassword } from '@/lib/customer.functions';
import { flushCustomerChanges } from '@/lib/customer-sync';
import type { Address } from '@/lib/types';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/account')({ component: AccountPage, head: () => ({ meta: [
  { title: 'Your account — SULTAN AL MISK' }, { name: 'description', content: 'Manage your SULTAN AL MISK delivery addresses and password.' },
  { property: 'og:title', content: 'Your account — SULTAN AL MISK' }, { property: 'og:description', content: 'Manage your delivery addresses and password.' },
  { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
] }) });

function AccountPage() {
  const customer = useStore(s => s.customers.find(c => c.id === s.currentCustomerId));
  const [draft, setDraft] = useState<Address | null>(null);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const input = 'mt-1 w-full rounded-md border bg-popover px-3 py-2';
  async function saveAddress() {
    if (!customer || !draft) return;
    setBusy(true);
    try {
      store.set(s => ({ ...s, customers: s.customers.map(c => c.id !== customer.id ? c : { ...c, addresses: c.addresses.some(a => a.id === draft.id) ? c.addresses.map(a => a.id === draft.id ? draft : a) : [...c.addresses, draft] }) }));
      await flushCustomerChanges(); setDraft(null); toast.success('Address saved');
    } catch { toast.error('Address could not be saved'); } finally { setBusy(false); }
  }
  return <div className="min-h-screen"><UserHeader /><main className="mx-auto max-w-3xl px-4 py-12 md:px-6">
    <Link to="/" className="text-sm text-primary">← Back to shop</Link>
    <h1 className="mt-6 font-serif text-4xl">Account details</h1>
    {!customer ? <p className="mt-6 text-muted-foreground">Please login to view your account.</p> : <>
      <p className="mt-2 break-words text-muted-foreground">{customer.username}</p>
      <section className="mt-10 border-t py-8"><div className="flex items-center justify-between gap-4"><h2 className="font-serif text-2xl">Delivery addresses</h2><Button variant="outline" onClick={() => setDraft({ id: crypto.randomUUID(), line1: '', pincode: '', city: '', state: '' })}>Add address</Button></div>
        <div className="mt-5 space-y-3">{customer.addresses.map(a => <div key={a.id} className="flex items-start justify-between gap-4 border-b py-4"><div><p>{a.line1}</p><p className="text-sm text-muted-foreground">{a.city}, {a.state} — {a.pincode}</p></div><Button variant="ghost" size="sm" onClick={() => setDraft(a)}>Edit</Button></div>)}{!customer.addresses.length && <p className="text-muted-foreground">No saved addresses.</p>}</div>
        {draft && <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={e => { e.preventDefault(); void saveAddress(); }}>
          <label className="text-sm sm:col-span-2">Flat no., building, area<input className={input} required value={draft.line1} onChange={e => setDraft({ ...draft, line1: e.target.value })} /></label>
          <label className="text-sm">Pincode<input className={input} required pattern="[0-9]{6}" value={draft.pincode} onChange={e => { const pin = e.target.value; setDraft({ ...draft, pincode: pin }); if (/^\d{6}$/.test(pin)) void fetch(`https://api.postalpincode.in/pincode/${pin}`).then(r => r.json()).then(j => { const po = j?.[0]?.PostOffice?.[0]; if (po) setDraft(d => d?.pincode === pin ? { ...d, state: po.State, city: po.District } : d); }).catch(() => undefined); }} /></label>
          <label className="text-sm">City<input className={input} required value={draft.city} onChange={e => setDraft({ ...draft, city: e.target.value })} /></label>
          <label className="text-sm">State<input className={input} required value={draft.state} onChange={e => setDraft({ ...draft, state: e.target.value })} /></label>
          <div className="flex items-end gap-2"><Button disabled={busy}>Save address</Button><Button type="button" variant="ghost" onClick={() => setDraft(null)}>Cancel</Button></div>
        </form>}
      </section>
      <section className="border-t py-8"><h2 className="font-serif text-2xl">Change password</h2><form className="mt-5 max-w-md space-y-4" onSubmit={async e => { e.preventDefault(); if (passwords.newPassword !== passwords.confirm) { toast.error('New passwords do not match'); return; } setBusy(true); try { if (customer.authManaged) { const { error } = await supabase.auth.updateUser({ password: passwords.newPassword, current_password: passwords.currentPassword }); if (error) throw error; } else { await changeCustomerPassword({ data: { currentPassword: passwords.currentPassword, newPassword: passwords.newPassword } }); } setPasswords({ currentPassword: '', newPassword: '', confirm: '' }); toast.success('Password changed'); } catch (error) { toast.error(error instanceof Error ? error.message : 'Password not changed'); } finally { setBusy(false); } }}>
        <label className="block text-sm">Current password<input type="password" autoComplete="current-password" className={input} required value={passwords.currentPassword} onChange={e => setPasswords({ ...passwords, currentPassword: e.target.value })} /></label>
        <label className="block text-sm">New password<input type="password" autoComplete="new-password" minLength={6} className={input} required value={passwords.newPassword} onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })} /></label>
        <label className="block text-sm">Confirm new password<input type="password" autoComplete="new-password" minLength={6} className={input} required value={passwords.confirm} onChange={e => setPasswords({ ...passwords, confirm: e.target.value })} /></label>
        <Button disabled={busy}>Change password</Button>
      </form></section>
    </>}
  </main><UserFooter /></div>;
}