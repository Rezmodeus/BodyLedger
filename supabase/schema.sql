-- Body Ledger schema. Run once in Supabase Dashboard -> SQL Editor.
-- Food values (kcal, protein, carbs, fat) are per 100 g.

create table if not exists public.settings (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  kcal_target int not null default 2000,
  protein_target int,
  carbs_target int,
  fat_target int
);

create table if not exists public.foods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  kcal numeric not null default 0,
  protein numeric not null default 0,
  carbs numeric not null default 0,
  fat numeric not null default 0,
  use_count int not null default 0,
  created_at timestamptz not null default now()
);

-- items = [{ "food_id": "...", "grams": 100 }, ...]
create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  meal_type text check (meal_type in ('breakfast','lunch','dinner','snack')),
  items jsonb not null default '[]',
  use_count int not null default 0,
  created_at timestamptz not null default now()
);

-- A logged entry keeps its own numbers, so later food edits do not change past days.
create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  entry_date date not null,
  meal_type text not null check (meal_type in ('breakfast','lunch','dinner','snack')),
  name text not null,
  grams numeric,
  food_id uuid references public.foods on delete set null,
  kcal numeric not null default 0,
  protein numeric not null default 0,
  carbs numeric not null default 0,
  fat numeric not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists entries_user_date on public.entries (user_id, entry_date);

alter table public.settings enable row level security;
alter table public.foods enable row level security;
alter table public.recipes enable row level security;
alter table public.entries enable row level security;

do $$
declare t text;
begin
  foreach t in array array['settings','foods','recipes','entries'] loop
    execute format('drop policy if exists "owner" on public.%I', t);
    execute format(
      'create policy "owner" on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())',
      t
    );
  end loop;
end $$;
