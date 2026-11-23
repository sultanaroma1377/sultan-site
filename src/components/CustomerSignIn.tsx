import { useState } from 'react';
import { Button } from './ui/button';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { signInCustomer, syncCloudCustomer } from '@/lib/customer-sync';

function GoogleLogo() {
  return <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-[18px] w-[18px]"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>;
}

export function CustomerSignIn({ signup, onDone, onBack }: { signup: boolean; onDone: () => void; onBack: () => void }) {
  const [method, setMethod] = useState<'email' | 'username'>('email');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  async function submit() {
    setBusy(true); setError(''); setNotice('');
    try {
      if (method === 'username') { await signInCustomer(identifier, password, signup); onDone(); return; }
      if (signup) {
        const { data, error } = await supabase.auth.signUp({ email: identifier.trim(), password, options: { emailRedirectTo: window.location.origin } });
        if (error) throw error;
        if (!data.session) { setNotice('Check your email to confirm your account, then log in.'); return; }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: identifier.trim(), password });
        if (error) throw error;
      }
      await syncCloudCustomer(); onDone();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not sign in. Please try again.'); }
    finally { setBusy(false); }
  }
  async function google() {
    setBusy(true); setError('');
    try {
      const result = await lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin });
      if (result.error) throw result.error;
      if (result.redirected) return;
      await syncCloudCustomer(); onDone();
    } catch (e) { setError(e instanceof Error ? e.message : 'Google sign-in failed. Please try again.'); }
    finally { setBusy(false); }
  }
  return <div className="mt-6 space-y-5 px-4">
    <h3 className="font-serif text-2xl">{signup ? 'Create account' : 'Login'}</h3>
    <Button variant="outline" className="google-sign-in w-full gap-[10px] px-3" disabled={busy} onClick={() => { void google(); }}><GoogleLogo />Continue with Google</Button>
    <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border"/>or<span className="h-px flex-1 bg-border"/></div>
    <div className="flex gap-1 border-b pb-2" role="group" aria-label="Login method">
      {(['email', 'username'] as const).map(value => <Button key={value} size="sm" variant={method === value ? 'default' : 'ghost'} disabled={busy} onClick={() => { setMethod(value); setIdentifier(''); setError(''); setNotice(''); }}>{value === 'email' ? 'Email' : 'Username'}</Button>)}
    </div>
    <form className="space-y-4" onSubmit={e => { e.preventDefault(); void submit(); }}>
      <label className="block text-sm">{method === 'email' ? 'Email address' : 'Username'}<input className="mt-1 w-full rounded-md border bg-background px-3 py-2" type={method === 'email' ? 'email' : 'text'} autoComplete="username" value={identifier} onChange={e => setIdentifier(e.target.value)} required disabled={busy}/></label>
      <label className="block text-sm">Password<input className="mt-1 w-full rounded-md border bg-background px-3 py-2" type="password" autoComplete={signup ? 'new-password' : 'current-password'} minLength={6} value={password} onChange={e => setPassword(e.target.value)} required disabled={busy}/></label>
      {error && <p role="alert" className="break-words text-sm text-destructive">{error}</p>}
      {notice && <p role="status" className="text-sm text-foreground">{notice}</p>}
      <Button type="submit" disabled={busy} className="w-full">{busy ? 'Please wait…' : signup ? 'Sign up' : 'Login'}</Button>
    </form>
    <Button variant="link" className="w-full" onClick={onBack} disabled={busy}>Back</Button>
  </div>;
}