import { useState } from 'react';
import type { Item } from '../types';
import { scale } from '../util';

const blank = (v: number) => (v ? String(v) : '');
const num = (s: string) => {
  const n = parseFloat(s.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

interface Props {
  initial?: Item;
  submitLabel: string;
  /** Show a servings multiplier (used when adding from the library). */
  servings?: boolean;
  /** Show a "save to my foods" checkbox. */
  offerSave?: boolean;
  onSubmit: (item: Item, opts: { save: boolean }) => void | Promise<void>;
  onDelete?: () => void;
  extra?: React.ReactNode;
}

export function ItemForm({ initial, submitLabel, servings, offerSave, onSubmit, onDelete, extra }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [serving, setServing] = useState(initial?.serving ?? '');
  const [kcal, setKcal] = useState(blank(initial?.kcal ?? 0));
  const [protein, setProtein] = useState(blank(initial?.protein ?? 0));
  const [carbs, setCarbs] = useState(blank(initial?.carbs ?? 0));
  const [fat, setFat] = useState(blank(initial?.fat ?? 0));
  const [qty, setQty] = useState('1');
  const [save, setSave] = useState(Boolean(offerSave));
  const [busy, setBusy] = useState(false);

  // Auto-estimate calories from macros when the user hasn't typed any.
  const estimate = Math.round(num(protein) * 4 + num(carbs) * 4 + num(fat) * 9);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      let item: Item = {
        name: name.trim(),
        serving: serving.trim() || null,
        kcal: kcal === '' ? estimate : num(kcal),
        protein: num(protein),
        carbs: num(carbs),
        fat: num(fat),
      };
      if (servings) item = scale(item, num(qty) || 1);
      await onSubmit(item, { save });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="form">
      <label>
        Name
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Coffee with soy milk" required autoFocus={!initial} />
      </label>
      <label>
        Serving (optional)
        <input value={serving} onChange={(e) => setServing(e.target.value)} placeholder="e.g. 1 cup, 100 g" />
      </label>
      <div className="grid4">
        <label>
          kcal
          <input inputMode="decimal" value={kcal} onChange={(e) => setKcal(e.target.value)} placeholder={estimate ? String(estimate) : '0'} />
        </label>
        <label>
          Protein g
          <input inputMode="decimal" value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="0" />
        </label>
        <label>
          Carbs g
          <input inputMode="decimal" value={carbs} onChange={(e) => setCarbs(e.target.value)} placeholder="0" />
        </label>
        <label>
          Fat g
          <input inputMode="decimal" value={fat} onChange={(e) => setFat(e.target.value)} placeholder="0" />
        </label>
      </div>
      {servings && (
        <label>
          Servings
          <input inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} />
        </label>
      )}
      {extra}
      {offerSave && (
        <label className="check">
          <input type="checkbox" checked={save} onChange={(e) => setSave(e.target.checked)} />
          Save to my foods for quick reuse
        </label>
      )}
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
