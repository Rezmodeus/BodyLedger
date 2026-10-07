import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { configured, supabase } from './supabase';
import { useBody, useLibrary } from './db';
import { Auth } from './components/Auth';
import { Today } from './components/Today';
import { Body } from './components/Body';
import { Library } from './components/Library';
import { SettingsPage } from './components/SettingsPage';
import { todayStr } from './util';

type Tab = 'today' | 'body' | 'library' | 'settings';

export function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!configured) {
    return (
      <main className="auth">
        <h1>Setup needed</h1>
        <p>Copy <code>.env.example</code> to <code>.env</code> and fill in your Supabase URL and anon key. See the README.</p>
      </main>
    );
  }
  if (session === undefined) return <main className="auth muted">Loading…</main>;
  if (!session) return <Auth />;
  return <Authed email={session.user.email ?? ''} />;
}

function Authed({ email }: { email: string }) {
  const lib = useLibrary();
  const body = useBody();
  const [tab, setTab] = useState<Tab>('today');
  const [date, setDate] = useState(todayStr());

  return (
    <>
      <header className="topbar">Body Ledger</header>
      {lib.loading ? (
        <p className="muted center">Loading…</p>
      ) : tab === 'today' ? (
        <Today lib={lib} date={date} setDate={setDate} />
      ) : tab === 'body' ? (
        <Body body={body} />
      ) : tab === 'library' ? (
        <Library lib={lib} />
      ) : (
        <SettingsPage lib={lib} email={email} />
      )}
      <nav className="bottomnav">
        <button className={tab === 'today' ? 'active' : ''} onClick={() => setTab('today')}>Log</button>
        <button className={tab === 'body' ? 'active' : ''} onClick={() => setTab('body')}>Body</button>
        <button className={tab === 'library' ? 'active' : ''} onClick={() => setTab('library')}>Library</button>
        <button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}>Targets</button>
      </nav>
    </>
  );
}
