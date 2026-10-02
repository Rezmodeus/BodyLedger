import { useState } from 'react';
import type { Food, Macros } from '../types';
import { num } from '../util';

const blank = (v: number) => (v ? String(v) : '');

interface Props {
  initial?: Food;
  onSubmit: (food: Macros & { name: string }) => void | Promise<void>;
  onDelete?: () => void;
}

/** Form for a food. All values are per 100 g. */
export function FoodForm({ initial, onSubmit, onDelete }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [kcal, setKcal] = useState(blank(initial?.kcal ?? 0));
  const [protein, setProtein] = useState(blank(initial?.protein ?? 0));
  const [carbs, setCarbs] = useState(blank(initial?.carbs ?? 0));
  const [fat, setFat] = useState(blank(initial?.fat ?? 0));
  const [busy, setBusy] = useState(false);

  const estimate = Math.round(num(protein) * 4 + num(carbs) * 4 + num(fat) * 9);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await onSubmit({
        name: name.trim(),
        kcal: kcal === '' ? estimate : num(kcal),
        protein: num(protein),
        carbs: num(carbs),
        fat: num(fat),
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="form">
      <label>
        Name
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Greek yoghurt 0%" required autoFocus={!initial} />
      </label>
      <p className="muted small-text">Numbers are per 100 g.</p>
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
      <div className="row">
        {onDelete && (
          <button type="button" className="btn danger" onClick={onDelete}>
            Delete
          </button>
        )}
        <button className="btn primary grow" disabled={busy}>
          Save
        </button>
      </div>
    </form>
  );
}
