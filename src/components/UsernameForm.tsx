import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { store, useStore } from '@/lib/store';
import { setCloudCustomerUsername } from '@/lib/customer-auth.functions';

export function UsernameForm({ onSaved }: { onSaved?: () => void }) {
  const current = useStore(s => s.customers.find(c => c.id === s.currentCustomerId));
  const [value, setValue] = useState(current && !current.username.startsWith('customer-') ? current.username : '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function save() {
    setBusy(true); setError('');
    try {
      const { username } = await setCloudCustomerUsername({ data: { username: value } });
      store.set(s => ({ ...s, customers: s.customers.map(c => c.id === s.currentCustomerId ? { ...c, username } : c) }));
      toast.success('Username saved'); onSaved?.();
    } catch (e) { setError(e instanceof Error ? e.message : 'Username not saved'); } finally { setBusy(false); }
  }
  return <form className="space-y-3" onSubmit={e => { e.preventDefault(); void save(); }}>
    <label className="block text-sm">Unique username<input className="mt-1 w-full rounded-md border bg-background px-3 py-2" value={value} onChange={e => setValue(e.target.value)} required minLength={3} maxLength={30} pattern="[A-Za-z0-9_.]+" disabled={busy} /></label>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <Button type="submit" disabled={busy} className="w-full">{busy ? 'Saving…' : 'Save username'}</Button>
  </form>;
}
