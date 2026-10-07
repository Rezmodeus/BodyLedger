# Body Ledger

Personal food and macro tracker. Mobile-first PWA, data synced through Supabase (free tier), static frontend.

## Features (v1)
- Log what you eat in Breakfast / Lunch / Dinner / Snacks, with kcal, protein, carbs, fat and fibre.
- Daily total, calories left against your target, and optional protein/carb/fat/fibre targets.
- **Foods**: kcal and macros per 100 g (Greek yoghurt, berries, Shreddies...), or per piece for things you count (e.g. candy: 50 kcal per piece, log 5 pieces).
- **Body**: register weight (kg, decimals) and waist (cm) per day.
- **Recipes**: a list of foods with grams (e.g. your usual breakfast). One tap logs the whole recipe. Tap ✎ to change grams first. In the Library you can swap a food (⇄) and the grams stay.
- Log one food: tap it, type grams, add.
- **Quick entry**: type name and numbers directly, nothing is saved (good for restaurants).
- Logged entries keep their own numbers, so editing a food later does not change past days.
- "Save as recipe" from a logged section. "Copy yesterday" for empty sections.
- Email/password login; only your account can read or change your data.

## Setup
1. Create a free project at <https://supabase.com>.
2. SQL Editor → paste and run `supabase/schema.sql`.
3. Authentication → Providers → Email: keep enabled. Create your account in the app, then turn **off "Allow new users to sign up"** (Authentication → Sign In / Providers) so nobody else can register. Optionally disable "Confirm email" while setting up.
4. `cp .env.example .env` and fill in the project URL and anon key (Project Settings → API).
5. `npm install && npm run dev`

## Deploy (free)
Any static host works (Cloudflare Pages, Netlify, Vercel). Build command `npm run build`, output `dist`, and set the two `VITE_SUPABASE_*` variables. Open the URL on your phone and use "Add to Home Screen" to install.

## Roadmap
A statistics screen (day/week/month totals, weight and waist trends). Tables are keyed by `user_id` and `entry_date`, so a daily history/calendar and body metrics (weight, waist, activity, training) can be added as new tables and tabs without changing the food data.
