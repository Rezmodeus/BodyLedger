# Body Ledger

Personal food and macro tracker. Mobile-first PWA, data synced through Supabase (free tier), static frontend.

## Features (v1)
- Log food per Breakfast / Lunch / Dinner / Snacks with kcal, protein, carbs, fat.
- Daily total, calories remaining vs. target, and optional protein/carb/fat targets with amounts left.
- **Foods**: saved presets. Tap once in the add sheet to log one serving; ✎ adjusts values or servings first.
- **Meals**: saved groups of items. Tap once to log the whole meal; each item becomes its own editable entry. In the Library you can swap any item (⇄) for another saved food and the totals update.
- "Save as meal" from any logged section, "Copy yesterday" for empty sections.
- Email/password login; row-level security means only your account can read or change your data.

## Setup
1. Create a free project at <https://supabase.com>.
2. SQL Editor → paste and run `supabase/schema.sql`.
3. Authentication → Providers → Email: keep enabled. Create your account in the app, then turn **off "Allow new users to sign up"** (Authentication → Sign In / Providers) so nobody else can register. Optionally disable "Confirm email" while setting up.
4. `cp .env.example .env` and fill in the project URL and anon key (Project Settings → API).
5. `npm install && npm run dev`

## Deploy (free)
Any static host works (Cloudflare Pages, Netlify, Vercel). Build command `npm run build`, output `dist`, and set the two `VITE_SUPABASE_*` variables. Open the URL on your phone and use "Add to Home Screen" to install.

## Roadmap
Tables are keyed by `user_id` and `entry_date`, so a daily history/calendar and body metrics (weight, waist, activity, training) can be added as new tables and tabs without changing the food data.
