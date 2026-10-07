import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { BodyMeasurement, Entry, Food, Item, MealType, Macros, Recipe, RecipeItem, Settings, Unit } from './types';

const DEFAULT_SETTINGS: Settings = {
  kcal_target: 2000,
  protein_target: null,
  carbs_target: null,
  fat_target: null,
  fibre_target: null,
};

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

type FoodInput = Macros & { id?: string; name: string; unit: Unit };
type RecipeInput = { id?: string; name: string; meal_type: MealType | null; items: RecipeItem[] };

/** Foods, recipes and settings. Small data, loaded once. */
export function useLibrary() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const [f, r, s] = await Promise.all([
      supabase.from('foods').select('*').order('use_count', { ascending: false }).order('name'),
      supabase.from('recipes').select('*').order('use_count', { ascending: false }).order('name'),
      supabase.from('settings').select('*').maybeSingle(),
    ]);
    setFoods(check(f) as Food[]);
    setRecipes(check(r) as Recipe[]);
    const row = check(s) as Settings | null;
    if (row) setSettings(row);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload().catch((e) => {
      console.error(e);
      setLoading(false);
    });
  }, [reload]);

  const saveFood = async (food: FoodInput) => {
    const { id, ...fields } = food;
    const res = id
      ? await supabase.from('foods').update(fields).eq('id', id).select().single()
      : await supabase.from('foods').insert(fields).select().single();
    const row = check(res) as Food;
    setFoods((fs) => (id ? fs.map((f) => (f.id === id ? row : f)) : [row, ...fs]));
    return row;
  };

  const deleteFood = async (id: string) => {
    const using = recipes.filter((r) => r.items.some((i) => i.food_id === id));
    if (using.length > 0) {
      throw new Error(`Used in: ${using.map((r) => r.name).join(', ')}. Remove it from those recipes first.`);
    }
    check(await supabase.from('foods').delete().eq('id', id));
    setFoods((fs) => fs.filter((f) => f.id !== id));
  };

  const saveRecipe = async (recipe: RecipeInput) => {
    const { id, ...fields } = recipe;
    const res = id
      ? await supabase.from('recipes').update(fields).eq('id', id).select().single()
      : await supabase.from('recipes').insert(fields).select().single();
    const row = check(res) as Recipe;
    setRecipes((rs) => (id ? rs.map((r) => (r.id === id ? row : r)) : [row, ...rs]));
    return row;
  };

  const deleteRecipe = async (id: string) => {
    check(await supabase.from('recipes').delete().eq('id', id));
    setRecipes((rs) => rs.filter((r) => r.id !== id));
  };

  const bumpUse = (table: 'foods' | 'recipes', id: string, current: number) => {
    // Fire and forget: only affects the order of the list.
    void supabase.from(table).update({ use_count: current + 1 }).eq('id', id);
    if (table === 'foods') setFoods((fs) => fs.map((f) => (f.id === id ? { ...f, use_count: current + 1 } : f)));
    else setRecipes((rs) => rs.map((r) => (r.id === id ? { ...r, use_count: current + 1 } : r)));
  };

  const saveSettings = async (s: Settings) => {
    const { data: u } = await supabase.auth.getUser();
    check(await supabase.from('settings').upsert({ ...s, user_id: u.user?.id }));
    setSettings(s);
  };

  return { foods, recipes, settings, loading, saveFood, deleteFood, saveRecipe, deleteRecipe, bumpUse, saveSettings };
}

const pick = (e: Item): Item => ({
  name: e.name,
  grams: e.grams,
  pieces: e.pieces,
  food_id: e.food_id,
  kcal: e.kcal,
  protein: e.protein,
  carbs: e.carbs,
  fat: e.fat,
  fibre: e.fibre,
});

/** Entries for one day. */
export function useEntries(date: string) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase
      .from('entries')
      .select('*')
      .eq('entry_date', date)
      .order('created_at')
      .then((res) => {
        if (cancelled) return;
        if (res.error) console.error(res.error);
        else setEntries(res.data as Entry[]);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [date]);

  const addEntries = async (items: Item[], meal_type: MealType) => {
    const rows = items.map((i) => ({ ...pick(i), entry_date: date, meal_type }));
    const added = check(await supabase.from('entries').insert(rows).select()) as Entry[];
    setEntries((es) => [...es, ...added]);
  };

  const updateEntry = async (id: string, patch: Partial<Entry>) => {
    const row = check(await supabase.from('entries').update(patch).eq('id', id).select().single()) as Entry;
    setEntries((es) => es.map((e) => (e.id === id ? row : e)));
  };

  const deleteEntry = async (id: string) => {
    check(await supabase.from('entries').delete().eq('id', id));
    setEntries((es) => es.filter((e) => e.id !== id));
  };

  /** Copy everything in one section from another day. */
  const copyFrom = async (fromDate: string, meal_type: MealType) => {
    const res = await supabase.from('entries').select('*').eq('entry_date', fromDate).eq('meal_type', meal_type);
    const src = check(res) as Entry[];
    if (src.length === 0) return 0;
    await addEntries(src.map(pick), meal_type);
    return src.length;
  };

  return { entries, loading, addEntries, updateEntry, deleteEntry, copyFrom };
}

/** Weight and waist, one row per day. Small data, loaded once. */
export function useBody() {
  const [rows, setRows] = useState<BodyMeasurement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('body_measurements')
      .select('measured_date, weight_kg, waist_cm')
      .order('measured_date', { ascending: false })
      .then((res) => {
        if (res.error) console.error(res.error);
        else setRows(res.data as BodyMeasurement[]);
        setLoading(false);
      });
  }, []);

  /** Save one day. Replaces that day's values. A row with both values empty is deleted. */
  const save = async (m: BodyMeasurement) => {
    if (m.weight_kg === null && m.waist_cm === null) {
      check(await supabase.from('body_measurements').delete().eq('measured_date', m.measured_date));
      setRows((rs) => rs.filter((r) => r.measured_date !== m.measured_date));
      return;
    }
    const { data: u } = await supabase.auth.getUser();
    check(await supabase.from('body_measurements').upsert({ ...m, user_id: u.user?.id }));
    setRows((rs) => [...rs.filter((r) => r.measured_date !== m.measured_date), m].sort((a, b) => b.measured_date.localeCompare(a.measured_date)));
  };

  return { rows, loading, save };
}
