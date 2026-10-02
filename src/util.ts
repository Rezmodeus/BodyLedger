import type { Item, Macros } from './types';

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

export function scale<T extends Macros>(item: T, n: number): T {
  return {
    ...item,
    kcal: round(item.kcal * n),
    protein: round(item.protein * n),
    carbs: round(item.carbs * n),
    fat: round(item.fat * n),
  };
}

export const round = (n: number) => Math.round(n * 10) / 10;
export const fmt = (n: number) => String(Math.round(n));

export const toItem = (i: Item): Item => ({
  name: i.name,
  serving: i.serving,
  kcal: i.kcal,
  protein: i.protein,
  carbs: i.carbs,
  fat: i.fat,
});

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
