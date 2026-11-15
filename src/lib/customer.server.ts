import { getCookie, setCookie, deleteCookie, setResponseHeader } from '@tanstack/react-start/server';

export async function database() {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  return supabaseAdmin;
}

export async function digest(value: string) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
}

export async function passwordHash(password: string, salt: string = crypto.randomUUID()) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 100000, hash: 'SHA-256' }, key, 256);
  return `${salt}:${Array.from(new Uint8Array(bits), b => b.toString(16).padStart(2, '0')).join('')}`;
}

export async function issueSession(customerId: string | null, admin = false) {
  const token = crypto.randomUUID() + crypto.randomUUID();
  const sb = await database();
  const { error } = await sb.from('shop_sessions').insert({ token_hash: await digest(token), customer_id: customerId, is_admin: admin, expires_at: new Date(Date.now() + 7 * 86400000).toISOString() });
  if (error) throw new Error('Could not sign in');
  setCookie(admin ? 'shop_admin' : 'shop_customer', token, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 7 * 86400 });
}

export async function requireSession(admin = false) {
  setResponseHeader('Cache-Control', 'no-store');
  const token = getCookie(admin ? 'shop_admin' : 'shop_customer');
  if (!token) throw new Error('Please sign in');
  const sb = await database();
  const { data, error } = await sb.from('shop_sessions').select('customer_id,is_admin').eq('token_hash', await digest(token)).gt('expires_at', new Date().toISOString()).maybeSingle();
  if (error || !data || (admin ? !data.is_admin : !data.customer_id)) throw new Error('Please sign in');
  return data;
}

export async function clearCustomerSession() {
  const token = getCookie('shop_customer');
  if (token) { const sb = await database(); await sb.from('shop_sessions').delete().eq('token_hash', await digest(token)); }
  deleteCookie('shop_customer', { path: '/' });
}

export function assertWriteOrigin() {
  // SameSite cookies and the RPC protocol are supplemented by an origin check.
  return import('@tanstack/react-start/server').then(({ getRequest }) => {
    const request = getRequest();
    const origin = request.headers.get('origin');
    if (origin && origin !== new URL(request.url).origin) throw new Error('Not allowed');
  });
}