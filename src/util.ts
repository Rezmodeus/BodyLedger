import type { Food, Item, Macros, Recipe } from './types';

export const ZERO: Macros = { kcal: 0, protein: 0, carbs: 0, fat: 0 };

export function sum(items: Macros[]): Macros {
  return items.reduce(
    (a, i) => ({
      kcal: a.kcal + i.kcal,
      protein: a.protein + i.protein,
      carbs: a.carbs + i.carbs,
      fat: a.fat + i.fat,
    }),
    ZERO,
  );
}

export const round = (n: number) => Math.round(n * 10) / 10;
export const fmt = (n: number) => String(Math.round(n));

export function foodItem(f: Food, grams: number): Item {
  const k = grams / 100;
  return {
    name: f.name,
    grams,
    food_id: f.id,
    kcal: round(f.kcal * k),
    protein: round(f.protein * k),
    carbs: round(f.carbs * k),
    fat: round(f.fat * k),
  };
}

export function recipeItems(r: Recipe, foods: Food[]): Item[] {
  return r.items.flatMap((i) => {
    const f = foods.find((x) => x.id === i.food_id);
    return f ? [foodItem(f, i.grams)] : [];
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
