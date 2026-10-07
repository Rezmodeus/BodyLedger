import { useState } from 'react';
import type { Food } from '../types';
import { fmt, macroLine, perLabel } from '../util';

export function FoodPicker({ foods, onPick }: { foods: Food[]; onPick: (f: Food) => void }) {
  const [q, setQ] = useState('');
  const needle = q.trim().toLowerCase();
  const list = foods.filter((f) => !needle || f.name.toLowerCase().includes(needle));
  return (
    <>
      <input className="search" type="search" placeholder="Search foods" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
      <ul className="list">
        {list.map((f) => (
          <li key={f.id}>
            <button className="list-main" onClick={() => onPick(f)}>
              <span className="name">{f.name}</span>
              <span className="sub">{perLabel(f)}: {fmt(f.kcal)} kcal · {macroLine(f)}</span>
            </button>
          </li>
        ))}
        {list.length === 0 && <li className="muted pad">{foods.length === 0 ? 'No foods yet. Add some in the Library.' : 'No matches.'}</li>}
      </ul>
    </>
  );
}
