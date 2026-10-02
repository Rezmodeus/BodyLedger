import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { Entry, Food, Item, MealType, SavedMeal, Settings } from './types';

const DEFAULT_SETTINGS: Settings = {
  kcal_target: 2000,
  protein_target: null,
  carbs_target: null,
  fat_target: null,
};

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

/** Library (foods, saved meals) and settings. Small data, loaded once and mutated optimistically. */
export function useLibrary() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [meals, setMeals] = useState<SavedMeal[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const [f, m, s] = await Promise.all([
      supabase.from('foods').select('*').order('use_count', { ascending: false }).order('name'),
      supabase.from('meals').select('*').order('use_count', { ascending: false }).order('name'),
      supabase.from('settings').select('*').maybeSingle(),
    ]);
    setFoods(check(f) as Food[]);
    setMeals(check(m) as SavedMeal[]);
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

  const saveFood = async (food: Item & { id?: string }) => {
    const { id, ...fields } = food;
    const res = id
      ? await supabase.from('foods').update(fields).eq('id', id).select().single()
      : await supabase.from('foods').insert(fields).select().single();
    const row = check(res) as Food;
    setFoods((fs) => (id ? fs.map((f) => (f.id === id ? row : f)) : [row, ...fs]));
    return row;
  };

  const deleteFood = async (id: string) => {
    check(await supabase.from('foods').delete().eq('id', id));
    setFoods((fs) => fs.filter((f) => f.id !== id));
  };

  const saveMeal = async (meal: { id?: string; name: string; meal_type: MealType | null; items: Item[] }) => {
    const { id, ...fields } = meal;
    const res = id
      ? await supabase.from('meals').update(fields).eq('id', id).select().single()
      : await supabase.from('meals').insert(fields).select().single();
    const row = check(res) as SavedMeal;
    setMeals((ms) => (id ? ms.map((m) => (m.id === id ? row : m)) : [row, ...ms]));
    return row;
  };

  const deleteMeal = async (id: string) => {
    check(await supabase.from('meals').delete().eq('id', id));
    setMeals((ms) => ms.filter((m) => m.id !== id));
  };

  const bumpUse = (table: 'foods' | 'meals', id: string, current: number) => {
    // Fire and forget: ordering of the quick-add list is not critical.
    void supabase.from(table).update({ use_count: current + 1 }).eq('id', id);
    if (table === 'foods') setFoods((fs) => fs.map((f) => (f.id === id ? { ...f, use_count: current + 1 } : f)));
    else setMeals((ms) => ms.map((m) => (m.id === id ? { ...m, use_count: current + 1 } : m)));
  };

  const saveSettings = async (s: Settings) => {
    const { data: u } = await supabase.auth.getUser();
    check(await supabase.from('settings').upsert({ ...s, user_id: u.user?.id }));
    setSettings(s);
  };

  return { foods, meals, settings, loading, saveFood, deleteFood, saveMeal, deleteMeal, bumpUse, saveSettings };
}

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
    const rows = items.map((i) => ({ ...i, entry_date: date, meal_type }));
    const added = check(await supabase.from('entries').insert(rows).select()) as Entry[];
    setEntries((es) => [...es, ...added]);
  };

  const updateEntry = async (id: string, patch: Partial<Entry>) => {
    const row = check(await supabase.from('entries').update(patch).eq('id', id).select().single()) as Entry;
    // Moving to another day removes it from this view.
    setEntries((es) => (row.entry_date === date ? es.map((e) => (e.id === id ? row : e)) : es.filter((e) => e.id !== id)));
  };

  const deleteEntry = async (id: string) => {
    check(await supabase.from('entries').delete().eq('id', id));
    setEntries((es) => es.filter((e) => e.id !== id));
  };

  /** Copy all entries of a meal from another date into this date. */
  const copyFrom = async (fromDate: string, meal_type: MealType) => {
    const res = await supabase.from('entries').select('*').eq('entry_date', fromDate).eq('meal_type', meal_type);
    const src = check(res) as Entry[];
    if (src.length === 0) return 0;
    await addEntries(src.map((e) => ({ name: e.name, serving: e.serving, kcal: e.kcal, protein: e.protein, carbs: e.carbs, fat: e.fat })), meal_type);
    return src.length;
  };

  return { entries, loading, addEntries, updateEntry, deleteEntry, copyFrom };
}
