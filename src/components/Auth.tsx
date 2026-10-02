import { useState } from 'react';
import { supabase } from '../supabase';

export function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    const { error, data } =
      mode === 'in'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (error) setMsg(error.message);
    else if (mode === 'up' && !data.session) setMsg('Check your email to confirm your account, then sign in.');
  };

  return (
    <main className="auth">
      <h1>Body Ledger</h1>
      <p className="muted">Your private food log.</p>
      <form onSubmit={submit} className="form">
        <label>
          Email
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </label>
        {msg && <p className="error">{msg}</p>}
        <button className="btn primary" disabled={busy}>
          {mode === 'in' ? 'Sign in' : 'Create account'}
        </button>
        <button type="button" className="btn link" onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>
          {mode === 'in' ? 'First time? Create the account' : 'Have an account? Sign in'}
        </button>
      </form>
    </main>
  );
}
