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

/** A food. Values are per 100 g. */
export interface Food extends Macros {
  id: string;
  name: string;
  use_count: number;
}

export interface RecipeItem {
  food_id: string;
  grams: number;
}

export interface Recipe {
  id: string;
  name: string;
  meal_type: MealType | null;
  items: RecipeItem[];
  use_count: number;
}

/** One thing eaten, with its own final numbers. */
export interface Item extends Macros {
  name: string;
  grams: number | null;
  food_id: string | null;
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
