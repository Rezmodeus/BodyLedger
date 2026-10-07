import { useState } from 'react';
import type { useBody } from '../db';
import { num, prettyDate, shiftDate, todayStr } from '../util';

type BodyState = ReturnType<typeof useBody>;

const show = (v: number | null) => (v === null ? '' : String(v));
const orNull = (s: string) => (s.trim() === '' || num(s) <= 0 ? null : num(s));

/** Register weight (kg) and waist (cm) for a day. Saving again for the same day replaces it. */
export function Body({ body }: { body: BodyState }) {
  const [date, setDate] = useState(todayStr());
  const existing = body.rows.find((r) => r.measured_date === date);
  // Re-key the form on date so it reloads that day's saved values.
  return (
    <div className="page">
      <div className="datebar">
        <button className="icon-btn" onClick={() => setDate(shiftDate(date, -1))} aria-label="Previous day">‹</button>
        <button className="date-title" onClick={() => setDate(todayStr())}>{prettyDate(date)}</button>
        <button className="icon-btn" onClick={() => setDate(shiftDate(date, 1))} aria-label="Next day">›</button>
      </div>
      <MeasureForm key={date + String(body.loading)} body={body} date={date} weight={show(existing?.weight_kg ?? null)} waist={show(existing?.waist_cm ?? null)} />
      <section className="card">
        <div className="card-head">
          <h2>History</h2>
        </div>
        <ul className="list">
          {body.rows.map((r) => (
            <li key={r.measured_date}>
              <button className="list-main" onClick={() => setDate(r.measured_date)}>
                <span className="name">{prettyDate(r.measured_date)}</span>
                <span className="sub">{r.measured_date}</span>
              </button>
              <span className="kcal">
                {r.weight_kg !== null ? `${r.weight_kg} kg` : '–'} · {r.waist_cm !== null ? `${r.waist_cm} cm` : '–'}
              </span>
            </li>
          ))}
        </ul>
        {!body.loading && body.rows.length === 0 && <p className="muted small-text">Nothing registered yet.</p>}
      </section>
    </div>
  );
}

function MeasureForm({ body, date, weight, waist }: { body: BodyState; date: string; weight: string; waist: string }) {
  const [w, setW] = useState(weight);
  const [c, setC] = useState(waist);
  const [msg, setMsg] = useState('');

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await body.save({ measured_date: date, weight_kg: orNull(w), waist_cm: orNull(c) });
      setMsg('Saved ✓');
    } catch (err) {
      setMsg((err as Error).message);
    }
  };

  return (
    <form className="card form" onSubmit={save}>
      <h2>Body measurements</h2>
      <div className="grid2">
        <label>
          Weight kg
          <input inputMode="decimal" value={w} onChange={(e) => setW(e.target.value)} placeholder="e.g. 82.4" />
        </label>
        <label>
          Waist cm
          <input inputMode="decimal" value={c} onChange={(e) => setC(e.target.value)} placeholder="e.g. 91.5" />
        </label>
      </div>
      <button className="btn primary">Save</button>
      {msg && <p className="muted">{msg}</p>}
    </form>
  );
}
