import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import type { Customer } from './types';

// This bridge never links accounts by a client-supplied ID or email address.
export const connectCloudCustomer = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: identity, error: authError } = await context.supabase.auth.getUser();
    if (authError || !identity.user || identity.user.id !== context.userId) throw new Error('Please sign in again');
    const h = await import('./customer.server');
    await h.assertWriteOrigin();
    const sb = await h.database();
    const id = identity.user.id;
    const existing = await sb.from('customer_accounts').select('*').eq('auth_user_id', id).maybeSingle();
    if (existing.error) throw new Error('Could not load your shopping account');
    let account = existing.data;
    if (!account) {
      const inserted = await sb.from('customer_accounts').upsert({
        auth_user_id: id,
        username: `customer-${id.replaceAll('-', '').slice(0, 16)}`,
        password_hash: await h.passwordHash(crypto.randomUUID()),
      }, { onConflict: 'auth_user_id', ignoreDuplicates: true }).select('*').maybeSingle();
      if (inserted.error) throw new Error('Could not create your shopping account');
      account = inserted.data ?? (await sb.from('customer_accounts').select('*').eq('auth_user_id', id).single()).data;
    }
    if (!account) throw new Error('Could not load your shopping account');
    await h.issueSession(account.id);
    const shopping = account.data as unknown as Pick<Customer, 'favorites' | 'cart' | 'addresses'>;
    return { id: account.id, username: account.username, password: '', authManaged: true, ...shopping } satisfies Customer;
  });
export const setCloudCustomerUsername = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { username: string }) => {
    const username = String(d?.username ?? '').trim().toLowerCase();
    if (!/^[a-z0-9_.]{3,30}$/.test(username) || username.startsWith('customer-')) throw new Error('Use 3–30 letters, numbers, dots or underscores');
    return { username };
  })
  .handler(async ({ context, data }) => {
    const h = await import('./customer.server');
    await h.assertWriteOrigin();
    const sb = await h.database();
    const taken = await sb.from('customer_accounts').select('id,auth_user_id').eq('username', data.username).maybeSingle();
    if (taken.error) throw new Error('Could not check username');
    if (taken.data && taken.data.auth_user_id !== context.userId) throw new Error('That username is already taken');
    const updated = await sb.from('customer_accounts').update({ username: data.username }).eq('auth_user_id', context.userId).select('username').single();
    if (updated.error) throw new Error('That username is already taken');
    return { username: updated.data.username };
  });
