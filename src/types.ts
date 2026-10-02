export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export const MEAL_TYPES: { id: MealType; label: string }[] = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'snack', label: 'Snacks' },
];

export interface Macros {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Item extends Macros {
  name: string;
  serving: string | null;
}

export interface Food extends Item {
  id: string;
  use_count: number;
}

export interface SavedMeal {
  id: string;
  name: string;
  meal_type: MealType | null;
  items: Item[];
  use_count: number;
}

export interface Entry extends Item {
  id: string;
  entry_date: string;
  meal_type: MealType;
}

export interface Settings {
  kcal_target: number;
  protein_target: number | null;
  carbs_target: number | null;
  fat_target: number | null;
}
