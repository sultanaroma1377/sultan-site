import { expect, mock, test } from 'bun:test';
import type { Customer } from './types';

type Context = { userId: string; supabase: { auth: { getUser: () => Promise<{ data: { user: { id: string } | null }; error: null }> } } };
let handler: ((input: { context: Context }) => Promise<Customer>) | undefined;
const filters: string[] = [];
const sessions: { id: string; admin: boolean }[] = [];
mock.module('@tanstack/react-start', () => ({ createServerFn: () => {
  const builder = { middleware: () => builder, handler: (fn: typeof handler) => { handler = fn; return fn; } };
  return builder;
} }));
mock.module('@/integrations/supabase/auth-middleware', () => ({ requireSupabaseAuth: {} }));
mock.module('./customer.server', () => ({
  assertWriteOrigin: async () => {},
  database: async () => ({ from: () => ({ select: () => ({ eq: (field: string, value: string) => {
    filters.push(`${field}:${value}`);
    return { maybeSingle: async () => ({ error: null, data: { id: 'shopping-account', username: 'customer', auth_user_id: 'verified-user', data: { favorites: [], cart: [], addresses: [] } } }) };
  } }) }) }),
  issueSession: async (id: string, admin = false) => { sessions.push({ id, admin }); },
}));
await import('./customer-auth.functions');
function run(context: Context) { if (!handler) throw new Error('Missing handler'); return handler({ context }); }
function context(id: string | null, claimed = 'verified-user'): Context {
  return { userId: claimed, supabase: { auth: { getUser: async () => ({ data: { user: id ? { id } : null }, error: null }) } } };
}
test('email and Google customer connections never issue an admin session', async () => {
  sessions.length = 0; filters.length = 0;
  const customer = await run(context('verified-user'));
  expect(sessions).toEqual([{ id: 'shopping-account', admin: false }]);
  expect(filters).toEqual(['auth_user_id:verified-user']);
  expect(customer.authManaged).toBe(true);
});
test('a mismatched or missing verified identity cannot open any shopping account', async () => {
  sessions.length = 0; filters.length = 0;
  await expect(run(context('other-user'))).rejects.toThrow('Please sign in again');
  await expect(run(context(null))).rejects.toThrow('Please sign in again');
  expect(sessions).toEqual([]); expect(filters).toEqual([]);
});