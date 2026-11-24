import { useStore } from '@/lib/store';
import { UsernameForm } from './UsernameForm';

export function UsernameGate() {
  const c = useStore(s => s.customers.find(x => x.id === s.currentCustomerId));
  if (!c?.authManaged || !c.username.startsWith('customer-')) return null;
  return <div role="dialog" aria-modal="true" aria-label="Choose your username" className="fixed inset-0 z-[100] grid place-items-center bg-overlay p-4">
    <div className="w-full max-w-sm space-y-4 rounded-lg border bg-card p-6">
      <h2 className="font-serif text-2xl">Choose your username</h2>
      <p className="text-sm text-muted-foreground">A unique username is required to continue. It appears with your reviews.</p>
      <UsernameForm />
    </div>
  </div>;
}
