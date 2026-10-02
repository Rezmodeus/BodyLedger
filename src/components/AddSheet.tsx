import { useMemo, useState } from 'react';
import type { Food, Item, MealType, SavedMeal } from '../types';
import { MEAL_TYPES } from '../types';
import { fmt, sum, toItem } from '../util';
import { ItemForm } from './ItemForm';
import { Sheet } from './Sheet';

interface Props {
  mealType: MealType;
  foods: Food[];
  meals: SavedMeal[];
  onAdd: (items: Item[]) => Promise<void>;
  onSaveFood: (item: Item) => Promise<Food>;
  onUsed: (table: 'foods' | 'meals', id: string, count: number) => void;
  onClose: () => void;
}

type View = { kind: 'list' } | { kind: 'new' } | { kind: 'edit-food'; food: Food };

export function AddSheet({ mealType, foods, meals, onAdd, onSaveFood, onUsed, onClose }: Props) {
  const [q, setQ] = useState('');
  const [view, setView] = useState<View>({ kind: 'list' });
  const [flash, setFlash] = useState<string | null>(null);
  const [added, setAdded] = useState(0);
  const label = MEAL_TYPES.find((m) => m.id === mealType)!.label;

  const needle = q.trim().toLowerCase();
  const matchedMeals = useMemo(
    () => meals.filter((m) => !needle || m.name.toLowerCase().includes(needle)),
    [meals, needle],
  );
  const matchedFoods = useMemo(
    () => foods.filter((f) => !needle || f.name.toLowerCase().includes(needle)),
    [foods, needle],
  );

  const add = async (items: Item[], name: string) => {
    await onAdd(items);
    setAdded((n) => n + 1);
    setFlash(`Added ${name}`);
    setTimeout(() => setFlash(null), 1400);
  };

  if (view.kind === 'new') {
    return (
      <Sheet title={`New item · ${label}`} onClose={onClose}>
        <ItemForm
          submitLabel={`Add to ${label}`}
          offerSave
          onSubmit={async (item, { save }) => {
            if (save) await onSaveFood(item);
            await onAdd([item]);
            onClose();
          }}
        />
      </Sheet>
    );
  }

  if (view.kind === 'edit-food') {
    const f = view.food;
    return (
      <Sheet title={`Adjust · ${label}`} onClose={onClose}>
        <ItemForm
          initial={f}
          servings
          submitLabel={`Add to ${label}`}
          onSubmit={async (item) => {
            await onAdd([item]);
            onUsed('foods', f.id, f.use_count);
            onClose();
          }}
        />
      </Sheet>
    );
  }

  return (
    <Sheet title={`Add to ${label}`} onClose={onClose}>
      <input
        className="search"
        type="search"
        placeholder="Search saved foods and meals"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <button className="btn primary block" onClick={() => setView({ kind: 'new' })}>
        + New item{needle ? ` “${q.trim()}”` : ''}
      </button>

      {matchedMeals.length > 0 && <h3 className="section">Meals</h3>}
      <ul className="list">
        {matchedMeals.map((m) => {
          const t = sum(m.items);
          return (
            <li key={m.id}>
              <button
                className="list-main"
                onClick={() => {
                  void add(m.items.map(toItem), m.name);
                  onUsed('meals', m.id, m.use_count);
                }}
              >
                <span className="name">{m.name}</span>
                <span className="sub">
                  {m.items.length} items · {fmt(t.kcal)} kcal · P{fmt(t.protein)} C{fmt(t.carbs)} F{fmt(t.fat)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {matchedFoods.length > 0 && <h3 className="section">Foods</h3>}
      <ul className="list">
        {matchedFoods.map((f) => (
          <li key={f.id}>
            <button
              className="list-main"
              onClick={() => {
                void add([toItem(f)], f.name);
                onUsed('foods', f.id, f.use_count);
              }}
            >
              <span className="name">
                {f.name}
                {f.serving && <span className="muted"> · {f.serving}</span>}
              </span>
              <span className="sub">
                {fmt(f.kcal)} kcal · P{fmt(f.protein)} C{fmt(f.carbs)} F{fmt(f.fat)}
              </span>
            </button>
            <button className="icon-btn" aria-label={`Adjust ${f.name}`} onClick={() => setView({ kind: 'edit-food', food: f })}>
              ✎
            </button>
          </li>
        ))}
      </ul>
      {matchedFoods.length === 0 && matchedMeals.length === 0 && (
        <p className="muted center">{foods.length + meals.length === 0 ? 'Nothing saved yet. Add a new item and tick “save”.' : 'No matches.'}</p>
      )}

      <div className="sheet-foot">
        {flash && <span className="flash">{flash} ✓</span>}
        <button className="btn grow" onClick={onClose}>
          {added > 0 ? `Done (${added} added)` : 'Cancel'}
        </button>
      </div>
    </Sheet>
  );
}
