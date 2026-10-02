import { useState } from 'react';
import type { useLibrary } from '../db';
import type { Food, Item, MealType, SavedMeal } from '../types';
import { MEAL_TYPES } from '../types';
import { fmt, sum, toItem } from '../util';
import { ItemForm } from './ItemForm';
import { Sheet } from './Sheet';

type Lib = ReturnType<typeof useLibrary>;

export function Library({ lib }: { lib: Lib }) {
  const [tab, setTab] = useState<'foods' | 'meals'>('foods');
  const [food, setFood] = useState<Food | 'new' | null>(null);
  const [meal, setMeal] = useState<SavedMeal | 'new' | null>(null);
  const [error, setError] = useState('');

  const guard = async (fn: () => Promise<unknown>) => {
    try {
      setError('');
      await fn();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="page">
      <div className="tabs">
        <button className={tab === 'foods' ? 'active' : ''} onClick={() => setTab('foods')}>Foods</button>
        <button className={tab === 'meals' ? 'active' : ''} onClick={() => setTab('meals')}>Meals</button>
      </div>
      {error && <p className="error">{error}</p>}

      {tab === 'foods' ? (
        <>
          <button className="btn primary block" onClick={() => setFood('new')}>+ New food</button>
          <ul className="list card">
            {lib.foods.map((f) => (
              <li key={f.id}>
                <button className="list-main" onClick={() => setFood(f)}>
                  <span className="name">{f.name}{f.serving && <span className="muted"> · {f.serving}</span>}</span>
                  <span className="sub">{fmt(f.kcal)} kcal · P{fmt(f.protein)} C{fmt(f.carbs)} F{fmt(f.fat)}</span>
                </button>
              </li>
            ))}
            {lib.foods.length === 0 && <li className="muted pad">No saved foods yet.</li>}
          </ul>
        </>
      ) : (
        <>
          <button className="btn primary block" onClick={() => setMeal('new')}>+ New meal</button>
          <ul className="list card">
            {lib.meals.map((m) => {
              const t = sum(m.items);
              return (
                <li key={m.id}>
                  <button className="list-main" onClick={() => setMeal(m)}>
                    <span className="name">{m.name}</span>
                    <span className="sub">{m.items.length} items · {fmt(t.kcal)} kcal · P{fmt(t.protein)} C{fmt(t.carbs)} F{fmt(t.fat)}</span>
                  </button>
                </li>
              );
            })}
            {lib.meals.length === 0 && <li className="muted pad">No saved meals yet. Log a meal, then tap “Save as meal”.</li>}
          </ul>
        </>
      )}

      {food && (
        <Sheet title={food === 'new' ? 'New food' : 'Edit food'} onClose={() => setFood(null)}>
          <ItemForm
            initial={food === 'new' ? undefined : food}
            submitLabel="Save"
            onSubmit={(item) => guard(async () => {
              await lib.saveFood(food === 'new' ? item : { ...item, id: food.id });
              setFood(null);
            })}
            onDelete={food === 'new' ? undefined : () => guard(async () => {
              if (!window.confirm(`Delete ${food.name}?`)) return;
              await lib.deleteFood(food.id);
              setFood(null);
            })}
            extra={food !== 'new' && (
              <button
                type="button"
                className="btn"
                onClick={() => guard(async () => {
                  await lib.saveFood({ ...toItem(food), name: `${food.name} (copy)` });
                  setFood(null);
                })}
              >
                Duplicate (to make a variant, e.g. oat instead of soy)
              </button>
            )}
          />
        </Sheet>
      )}

      {meal && <MealEditor lib={lib} meal={meal} onClose={() => setMeal(null)} guard={guard} />}
    </div>
  );
}

function MealEditor({ lib, meal, onClose, guard }: {
  lib: Lib;
  meal: SavedMeal | 'new';
  onClose: () => void;
  guard: (fn: () => Promise<unknown>) => Promise<void>;
}) {
  const existing = meal === 'new' ? null : meal;
  const [name, setName] = useState(existing?.name ?? '');
  const [mt, setMt] = useState<MealType | ''>(existing?.meal_type ?? '');
  const [items, setItems] = useState<Item[]>(existing?.items ?? []);
  // index being replaced, 'add' for appending, null for closed
  const [picking, setPicking] = useState<number | 'add' | null>(null);
  const [editIdx, setEditIdx] = useState<number | null>(null);

  const t = sum(items);

  if (editIdx !== null) {
    return (
      <Sheet title="Edit item" onClose={() => setEditIdx(null)}>
        <ItemForm
          initial={items[editIdx]}
          submitLabel="OK"
          onSubmit={(item) => {
            setItems((is) => is.map((x, i) => (i === editIdx ? item : x)));
            setEditIdx(null);
          }}
        />
      </Sheet>
    );
  }

  if (picking !== null) {
    return (
      <Sheet title={picking === 'add' ? 'Add item' : 'Swap item'} onClose={() => setPicking(null)}>
        <ul className="list">
          {lib.foods.map((f) => (
            <li key={f.id}>
              <button
                className="list-main"
                onClick={() => {
                  setItems((is) => (picking === 'add' ? [...is, toItem(f)] : is.map((x, i) => (i === picking ? toItem(f) : x))));
                  setPicking(null);
                }}
              >
                <span className="name">{f.name}</span>
                <span className="sub">{fmt(f.kcal)} kcal · P{fmt(f.protein)} C{fmt(f.carbs)} F{fmt(f.fat)}</span>
              </button>
            </li>
          ))}
          {lib.foods.length === 0 && <li className="muted pad">Save some foods first.</li>}
        </ul>
      </Sheet>
    );
  }

  return (
    <Sheet title={existing ? 'Edit meal' : 'New meal'} onClose={onClose}>
      <div className="form">
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Usual breakfast" />
        </label>
        <label>
          Usually eaten at
          <select value={mt} onChange={(e) => setMt(e.target.value as MealType | '')}>
            <option value="">Any</option>
            {MEAL_TYPES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </label>
        <ul className="list">
          {items.map((it, i) => (
            <li key={i}>
              <button className="list-main" onClick={() => setEditIdx(i)}>
                <span className="name">{it.name}</span>
                <span className="sub">{fmt(it.kcal)} kcal · P{fmt(it.protein)} C{fmt(it.carbs)} F{fmt(it.fat)}</span>
              </button>
              <button className="icon-btn" aria-label="Swap item" onClick={() => setPicking(i)}>⇄</button>
              <button className="icon-btn" aria-label="Remove item" onClick={() => setItems((is) => is.filter((_, j) => j !== i))}>✕</button>
            </li>
          ))}
        </ul>
        <button type="button" className="btn" onClick={() => setPicking('add')}>+ Add item from foods</button>
        <p className="muted">Total: {fmt(t.kcal)} kcal · P{fmt(t.protein)} C{fmt(t.carbs)} F{fmt(t.fat)}</p>
        <div className="row">
          {existing && (
            <button
              type="button"
              className="btn danger"
              onClick={() => guard(async () => {
                if (!window.confirm(`Delete ${existing.name}?`)) return;
                await lib.deleteMeal(existing.id);
                onClose();
              })}
            >
              Delete
            </button>
          )}
          <button
            className="btn primary grow"
            disabled={!name.trim() || items.length === 0}
            onClick={() => guard(async () => {
              await lib.saveMeal({ id: existing?.id, name: name.trim(), meal_type: mt || null, items });
              onClose();
            })}
          >
            Save meal
          </button>
        </div>
      </div>
    </Sheet>
  );
}
