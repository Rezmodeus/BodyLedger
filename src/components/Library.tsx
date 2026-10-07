import { useState } from 'react';
import type { useLibrary } from '../db';
import type { Food, MealType, Recipe } from '../types';
import { MEAL_TYPES } from '../types';
import { fmt, foodItem, macroLine, num, perLabel, sum } from '../util';
import { FoodForm } from './FoodForm';
import { FoodPicker } from './FoodPicker';
import { Sheet } from './Sheet';

type Lib = ReturnType<typeof useLibrary>;
type Guard = (fn: () => Promise<unknown>) => Promise<void>;

export function Library({ lib }: { lib: Lib }) {
  const [tab, setTab] = useState<'foods' | 'recipes'>('foods');
  const [food, setFood] = useState<Food | 'new' | null>(null);
  const [recipe, setRecipe] = useState<Recipe | 'new' | null>(null);

  const guard: Guard = async (fn) => {
    try {
      await fn();
    } catch (e) {
      window.alert((e as Error).message);
    }
  };

  return (
    <div className="page">
      <div className="tabs">
        <button className={tab === 'foods' ? 'active' : ''} onClick={() => setTab('foods')}>Foods</button>
        <button className={tab === 'recipes' ? 'active' : ''} onClick={() => setTab('recipes')}>Recipes</button>
      </div>

      {tab === 'foods' ? (
        <>
          <button className="btn primary block" onClick={() => setFood('new')}>+ New food</button>
          <ul className="list card">
            {lib.foods.map((f) => (
              <li key={f.id}>
                <button className="list-main" onClick={() => setFood(f)}>
                  <span className="name">{f.name}</span>
                  <span className="sub">{perLabel(f)}: {fmt(f.kcal)} kcal · {macroLine(f)}</span>
                </button>
              </li>
            ))}
            {lib.foods.length === 0 && <li className="muted pad">No foods yet.</li>}
          </ul>
        </>
      ) : (
        <>
          <button className="btn primary block" onClick={() => setRecipe('new')}>+ New recipe</button>
          <ul className="list card">
            {lib.recipes.map((r) => {
              const t = sum(r.items.flatMap((i) => {
                const f = lib.foods.find((x) => x.id === i.food_id);
                return f ? [foodItem(f, i.amount)] : [];
              }));
              return (
                <li key={r.id}>
                  <button className="list-main" onClick={() => setRecipe(r)}>
                    <span className="name">{r.name}</span>
                    <span className="sub">{r.items.length} items · {fmt(t.kcal)} kcal · {macroLine(t)}</span>
                  </button>
                </li>
              );
            })}
            {lib.recipes.length === 0 && <li className="muted pad">No recipes yet. Add foods first, then build a recipe.</li>}
          </ul>
        </>
      )}

      {food && (
        <Sheet title={food === 'new' ? 'New food' : 'Edit food'} onClose={() => setFood(null)}>
          <FoodForm
            initial={food === 'new' ? undefined : food}
            onSubmit={(v) => guard(async () => {
              await lib.saveFood(food === 'new' ? v : { ...v, id: food.id });
              setFood(null);
            })}
            onDelete={food === 'new' ? undefined : () => guard(async () => {
              if (!window.confirm(`Delete ${food.name}?`)) return;
              await lib.deleteFood(food.id);
              setFood(null);
            })}
          />
        </Sheet>
      )}

      {recipe && <RecipeEditor lib={lib} recipe={recipe} onClose={() => setRecipe(null)} guard={guard} />}
    </div>
  );
}

interface Row {
  food_id: string;
  amount: string;
}

function RecipeEditor({ lib, recipe, onClose, guard }: { lib: Lib; recipe: Recipe | 'new'; onClose: () => void; guard: Guard }) {
  const existing = recipe === 'new' ? null : recipe;
  const [name, setName] = useState(existing?.name ?? '');
  const [mt, setMt] = useState<MealType | ''>(existing?.meal_type ?? '');
  const [rows, setRows] = useState<Row[]>(existing?.items.map((i) => ({ food_id: i.food_id, amount: String(i.amount) })) ?? []);
  // row index being swapped, 'add' to append, null when closed
  const [picking, setPicking] = useState<number | 'add' | null>(null);

  const foodOf = (id: string) => lib.foods.find((f) => f.id === id);
  const total = sum(rows.flatMap((r) => {
    const f = foodOf(r.food_id);
    return f ? [foodItem(f, num(r.amount))] : [];
  }));

  if (picking !== null) {
    return (
      <Sheet title={picking === 'add' ? 'Add food' : 'Swap food (amount stays)'} onClose={() => setPicking(null)}>
        <FoodPicker
          foods={lib.foods}
          onPick={(f) => {
            setRows((rs) => (picking === 'add' ? [...rs, { food_id: f.id, amount: f.unit === 'piece' ? '1' : '100' }] : rs.map((r, i) => (i === picking ? { ...r, food_id: f.id } : r))));
            setPicking(null);
          }}
        />
      </Sheet>
    );
  }

  return (
    <Sheet title={existing ? 'Edit recipe' : 'New recipe'} onClose={onClose}>
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
          {rows.map((r, i) => (
            <li key={i}>
              <span className="list-main">
                <span className="name">{foodOf(r.food_id)?.name ?? '(deleted food)'}</span>
              </span>
              <input
                className="grams-in"
                inputMode="decimal"
                value={r.amount}
                onChange={(e) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))}
                aria-label="Amount"
              />
              <span className="muted">{foodOf(r.food_id)?.unit === 'piece' ? 'pcs' : 'g'}</span>
              <button className="icon-btn" aria-label="Swap food" onClick={() => setPicking(i)}>⇄</button>
              <button className="icon-btn" aria-label="Remove food" onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}>✕</button>
            </li>
          ))}
        </ul>
        <button type="button" className="btn" onClick={() => setPicking('add')}>+ Add food</button>
        <p className="muted">Total: {fmt(total.kcal)} kcal · {macroLine(total)}</p>
        <div className="row">
          {existing && (
            <button
              type="button"
              className="btn danger"
              onClick={() => guard(async () => {
                if (!window.confirm(`Delete ${existing.name}?`)) return;
                await lib.deleteRecipe(existing.id);
                onClose();
              })}
            >
              Delete
            </button>
          )}
          <button
            className="btn primary grow"
            disabled={!name.trim() || rows.length === 0}
            onClick={() => guard(async () => {
              await lib.saveRecipe({
                id: existing?.id,
                name: name.trim(),
                meal_type: mt || null,
                items: rows.map((r) => ({ food_id: r.food_id, amount: num(r.amount) })),
              });
              onClose();
            })}
          >
            Save recipe
          </button>
        </div>
      </div>
    </Sheet>
  );
}
