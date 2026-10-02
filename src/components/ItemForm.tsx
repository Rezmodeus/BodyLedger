import { useRef, useState } from 'react';
import type { Item } from '../types';
import { num, round } from '../util';

const blank = (v: number) => (v ? String(v) : '');
type Key = 'kcal' | 'protein' | 'carbs' | 'fat';

interface Props {
  initial?: Item;
  submitLabel: string;
  onSubmit: (item: Item) => void | Promise<void>;
  onDelete?: () => void;
  extra?: React.ReactNode;
}

/** Form for one thing eaten. Totals for what you ate, not per 100 g. */
export function ItemForm({ initial, submitLabel, onSubmit, onDelete, extra }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [grams, setGrams] = useState(initial?.grams ? String(initial.grams) : '');
  const [f, setF] = useState<Record<Key, string>>({
    kcal: blank(initial?.kcal ?? 0),
    protein: blank(initial?.protein ?? 0),
    carbs: blank(initial?.carbs ?? 0),
    fat: blank(initial?.fat ?? 0),
  });
  const [busy, setBusy] = useState(false);
  // Numbers to scale from when grams change.
  const base = useRef({ g: initial?.grams ?? 0, kcal: initial?.kcal ?? 0, protein: initial?.protein ?? 0, carbs: initial?.carbs ?? 0, fat: initial?.fat ?? 0 });

  const onGrams = (v: string) => {
    setGrams(v);
    const g = num(v);
    const b = base.current;
    if (b.g > 0 && g > 0) {
      const k = g / b.g;
      setF({
        kcal: blank(round(b.kcal * k)),
        protein: blank(round(b.protein * k)),
        carbs: blank(round(b.carbs * k)),
        fat: blank(round(b.fat * k)),
      });
    }
  };

  const onField = (key: Key, v: string) => {
    const next = { ...f, [key]: v };
    setF(next);
    base.current = { g: num(grams), kcal: num(next.kcal), protein: num(next.protein), carbs: num(next.carbs), fat: num(next.fat) };
  };

  const estimate = Math.round(num(f.protein) * 4 + num(f.carbs) * 4 + num(f.fat) * 9);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await onSubmit({
        name: name.trim(),
        grams: num(grams) > 0 ? num(grams) : null,
        food_id: initial?.food_id ?? null,
        kcal: f.kcal === '' ? estimate : num(f.kcal),
        protein: num(f.protein),
        carbs: num(f.carbs),
        fat: num(f.fat),
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="form">
      <label>
        Name
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Restaurant lunch" required autoFocus={!initial} />
      </label>
      <label>
        Grams (optional)
        <input inputMode="decimal" value={grams} onChange={(e) => onGrams(e.target.value)} placeholder="e.g. 150" />
      </label>
      <div className="grid4">
        <label>
          kcal
          <input inputMode="decimal" value={f.kcal} onChange={(e) => onField('kcal', e.target.value)} placeholder={estimate ? String(estimate) : '0'} />
        </label>
        <label>
          Protein g
          <input inputMode="decimal" value={f.protein} onChange={(e) => onField('protein', e.target.value)} placeholder="0" />
        </label>
        <label>
          Carbs g
          <input inputMode="decimal" value={f.carbs} onChange={(e) => onField('carbs', e.target.value)} placeholder="0" />
        </label>
        <label>
          Fat g
          <input inputMode="decimal" value={f.fat} onChange={(e) => onField('fat', e.target.value)} placeholder="0" />
        </label>
      </div>
      {extra}
      <div className="row">
        {onDelete && (
          <button type="button" className="btn danger" onClick={onDelete}>
            Delete
          </button>
        )}
        <button className="btn primary grow" disabled={busy}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
