import type { Food, Item, Macros, Recipe } from './types';

export const ZERO: Macros = { kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 };

export function sum(items: Macros[]): Macros {
  return items.reduce(
    (a, i) => ({
      kcal: a.kcal + i.kcal,
      protein: a.protein + i.protein,
      carbs: a.carbs + i.carbs,
      fat: a.fat + i.fat,
      fibre: a.fibre + i.fibre,
    }),
    ZERO,
  );
}

export const round = (n: number) => Math.round(n * 10) / 10;
export const fmt = (n: number) => String(Math.round(n));

/** "P12 C30 F4 Fi2" */
export const macroLine = (m: Macros) => `P${fmt(m.protein)} C${fmt(m.carbs)} F${fmt(m.fat)} Fi${fmt(m.fibre)}`;

/** "per 100 g" or "per piece" */
export const perLabel = (f: Food) => (f.unit === 'piece' ? 'per piece' : 'per 100 g');

/** "150 g" or "5 pcs" for an amount of a food. */
export const amountLabel = (f: Food, amount: number) => `${fmt(amount)} ${f.unit === 'piece' ? (amount === 1 ? 'pc' : 'pcs') : 'g'}`;

/** Item for `amount` of a food: grams for a per-100-g food, pieces for a per-piece food. */
export function foodItem(f: Food, amount: number): Item {
  const piece = f.unit === 'piece';
  const k = piece ? amount : amount / 100;
  return {
    name: f.name,
    grams: piece ? null : amount,
    pieces: piece ? amount : null,
    food_id: f.id,
    kcal: round(f.kcal * k),
    protein: round(f.protein * k),
    carbs: round(f.carbs * k),
    fat: round(f.fat * k),
    fibre: round(f.fibre * k),
  };
}

export function recipeItems(r: Recipe, foods: Food[]): Item[] {
  return r.items.flatMap((i) => {
    const f = foods.find((x) => x.id === i.food_id);
    return f ? [foodItem(f, i.amount)] : [];
  });
}

export const num = (s: string) => {
  const n = parseFloat(s.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

export function todayStr(): string {
  return dateStr(new Date());
}

export function dateStr(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function shiftDate(s: string, days: number): string {
  const [y, m, d] = s.split('-').map(Number);
  return dateStr(new Date(y, m - 1, d + days));
}

export function prettyDate(s: string): string {
  const today = todayStr();
  if (s === today) return 'Today';
  if (s === shiftDate(today, -1)) return 'Yesterday';
  if (s === shiftDate(today, 1)) return 'Tomorrow';
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}
