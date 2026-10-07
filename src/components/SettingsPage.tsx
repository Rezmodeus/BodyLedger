import { useState } from 'react';
import type { useLibrary } from '../db';
import { supabase } from '../supabase';

type Lib = ReturnType<typeof useLibrary>;

const toNum = (s: string) => {
  const n = parseInt(s, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
};

export function SettingsPage({ lib, email }: { lib: Lib; email: string }) {
  const s = lib.settings;
  const [kcal, setKcal] = useState(String(s.kcal_target));
  const [p, setP] = useState(s.protein_target?.toString() ?? '');
  const [c, setC] = useState(s.carbs_target?.toString() ?? '');
  const [f, setF] = useState(s.fat_target?.toString() ?? '');
  const [fi, setFi] = useState(s.fibre_target?.toString() ?? '');
  const [msg, setMsg] = useState('');

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await lib.saveSettings({
        kcal_target: toNum(kcal) ?? 2000,
        protein_target: toNum(p),
        carbs_target: toNum(c),
        fat_target: toNum(f),
        fibre_target: toNum(fi),
      });
      setMsg('Saved ✓');
    } catch (err) {
      setMsg((err as Error).message);
    }
  };

  return (
    <div className="page">
      <form className="card form" onSubmit={save}>
        <h2>Daily targets</h2>
        <label>
          Calories (kcal)
          <input inputMode="numeric" value={kcal} onChange={(e) => setKcal(e.target.value)} />
        </label>
        <div className="grid2">
          <label>
            Protein g
            <input inputMode="numeric" value={p} onChange={(e) => setP(e.target.value)} placeholder="optional" />
          </label>
          <label>
            Carbs g
            <input inputMode="numeric" value={c} onChange={(e) => setC(e.target.value)} placeholder="optional" />
          </label>
          <label>
            Fat g
            <input inputMode="numeric" value={f} onChange={(e) => setF(e.target.value)} placeholder="optional" />
          </label>
          <label>
            Fibre g
            <input inputMode="numeric" value={fi} onChange={(e) => setFi(e.target.value)} placeholder="optional" />
          </label>
        </div>
        <button className="btn primary">Save targets</button>
        {msg && <p className="muted">{msg}</p>}
      </form>
      <div className="card">
        <p className="muted">Signed in as {email}</p>
        <button className="btn block" onClick={() => supabase.auth.signOut()}>Sign out</button>
      </div>
    </div>
  );
}
