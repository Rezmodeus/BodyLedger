import { useMemo, useState } from 'react';
import type { Food, Item, MealType, Recipe } from '../types';
import { MEAL_TYPES } from '../types';
import { fmt, foodItem, num, recipeItems, sum } from '../util';
import { ItemForm } from './ItemForm';
import { Sheet } from './Sheet';

interface Props {
  mealType: MealType;
  foods: Food[];
  recipes: Recipe[];
  onAdd: (items: Item[]) => Promise<void>;
  onUsed: (table: 'foods' | 'recipes', id: string, count: number) => void;
  onClose: () => void;
}

type View =
  | { kind: 'list' }
  | { kind: 'quick' }
  | { kind: 'food'; food: Food }
  | { kind: 'recipe'; recipe: Recipe };

export function AddSheet({ mealType, foods, recipes, onAdd, onUsed, onClose }: Props) {
  const [q, setQ] = useState('');
  const [view, setView] = useState<View>({ kind: 'list' });
  const [flash, setFlash] = useState<string | null>(null);
  const [added, setAdded] = useState(0);
  const label = MEAL_TYPES.find((m) => m.id === mealType)!.label;

  const needle = q.trim().toLowerCase();
  const matchedRecipes = useMemo(() => recipes.filter((r) => !needle || r.name.toLowerCase().includes(needle)), [recipes, needle]);
  const matchedFoods = useMemo(() => foods.filter((f) => !needle || f.name.toLowerCase().includes(needle)), [foods, needle]);

  const add = async (items: Item[], name: string) => {
    try {
      await onAdd(items);
    } catch (e) {
      window.alert((e as Error).message);
      return;
    }
    setAdded((n) => n + 1);
    setFlash(`Added ${name}`);
    setView({ kind: 'list' });
    setTimeout(() => setFlash(null), 1400);
  };

  if (view.kind === 'quick') {
    return (
      <Sheet title={`Quick entry · ${label}`} onClose={() => setView({ kind: 'list' })}>
        <ItemForm submitLabel={`Add to ${label}`} onSubmit={(item) => add([item], item.name)} />
      </Sheet>
    );
  }

  if (view.kind === 'food') {
    const f = view.food;
    return (
      <Sheet title={f.name} onClose={() => setView({ kind: 'list' })}>
        <GramsStep
          food={f}
          label={label}
          onAdd={(item) => {
            onUsed('foods', f.id, f.use_count);
            return add([item], f.name);
          }}
        />
      </Sheet>
    );
  }

  if (view.kind === 'recipe') {
    const r = view.recipe;
    return (
      <Sheet title={r.name} onClose={() => setView({ kind: 'list' })}>
        <RecipeStep
          recipe={r}
          foods={foods}
          label={label}
          onAdd={(items) => {
            onUsed('recipes', r.id, r.use_count);
            return add(items, r.name);
          }}
        />
      </Sheet>
    );
  }

  return (
    <Sheet title={`Add to ${label}`} onClose={onClose}>
      <input className="search" type="search" placeholder="Search foods and recipes" value={q} onChange={(e) => setQ(e.target.value)} />
      <button className="btn primary block" onClick={() => setView({ kind: 'quick' })}>
        + Quick entry (no saving)
      </button>

      {matchedRecipes.length > 0 && <h3 className="section">Recipes</h3>}
      <ul className="list">
        {matchedRecipes.map((r) => {
          const items = recipeItems(r, foods);
          const t = sum(items);
          return (
            <li key={r.id}>
              <button
                className="list-main"
                onClick={() => {
                  onUsed('recipes', r.id, r.use_count);
                  void add(items, r.name);
                }}
              >
                <span className="name">{r.name}</span>
                <span className="sub">
                  {items.length} items · {fmt(t.kcal)} kcal · P{fmt(t.protein)} C{fmt(t.carbs)} F{fmt(t.fat)}
                </span>
              </button>
              <button className="icon-btn" aria-label={`Adjust ${r.name}`} onClick={() => setView({ kind: 'recipe', recipe: r })}>
                ✎
              </button>
            </li>
          );
        })}
      </ul>

      {matchedFoods.length > 0 && <h3 className="section">Foods</h3>}
      <ul className="list">
        {matchedFoods.map((f) => (
          <li key={f.id}>
            <button className="list-main" onClick={() => setView({ kind: 'food', food: f })}>
              <span className="name">{f.name}</span>
              <span className="sub">
                per 100 g: {fmt(f.kcal)} kcal · P{fmt(f.protein)} C{fmt(f.carbs)} F{fmt(f.fat)}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {matchedFoods.length === 0 && matchedRecipes.length === 0 && (
        <p className="muted center">{foods.length + recipes.length === 0 ? 'Nothing saved yet. Add foods in the Library, or use Quick entry.' : 'No matches.'}</p>
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

function GramsStep({ food, label, onAdd }: { food: Food; label: string; onAdd: (item: Item) => void | Promise<void> }) {
  const [grams, setGrams] = useState('100');
  const g = num(grams);
  const item = foodItem(food, g);
  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        if (g > 0) void onAdd(item);
      }}
    >
      <label>
        Grams
        <input inputMode="decimal" value={grams} onChange={(e) => setGrams(e.target.value)} autoFocus onFocus={(e) => e.target.select()} />
      </label>
      <p className="muted">
        {fmt(item.kcal)} kcal · P{fmt(item.protein)} C{fmt(item.carbs)} F{fmt(item.fat)}
      </p>
      <button className="btn primary" disabled={g <= 0}>
        Add to {label}
      </button>
    </form>
  );
}

function RecipeStep({ recipe, foods, label, onAdd }: { recipe: Recipe; foods: Food[]; label: string; onAdd: (items: Item[]) => void | Promise<void> }) {
  const [grams, setGrams] = useState(recipe.items.map((i) => String(i.grams)));
  const rows = recipe.items.flatMap((ri, idx) => {
    const food = foods.find((f) => f.id === ri.food_id);
    return food ? [{ idx, food }] : [];
  });
  const items = rows.map(({ idx, food }) => foodItem(food, num(grams[idx])));
  const t = sum(items);
  return (
    <div className="form">
      <ul className="list">
        {rows.map(({ idx, food }) => (
          <li key={idx}>
            <span className="list-main">
              <span className="name">{food.name}</span>
            </span>
            <input
              className="grams-in"
              inputMode="decimal"
              value={grams[idx]}
              onChange={(e) => setGrams((gs) => gs.map((g, i) => (i === idx ? e.target.value : g)))}
              aria-label={`Grams of ${food.name}`}
            />
            <span className="muted"> g</span>
          </li>
        ))}
      </ul>
      <p className="muted">
        {fmt(t.kcal)} kcal · P{fmt(t.protein)} C{fmt(t.carbs)} F{fmt(t.fat)}
      </p>
      <button className="btn primary" onClick={() => void onAdd(items.filter((i) => (i.grams ?? 0) > 0))}>
        Add to {label}
      </button>
    </div>
  );
}
