# Mise 🍽️

A mobile-first meal planning PWA. Designed for iPhone-sized screens and built
to feel like a native app: bottom tab navigation, safe-area support, big
touch targets, and full offline support for your meal plan, recipes, and
grocery list.

## Stack

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS 4** with a warm, minimal theme (off-white + sage)
- **shadcn/ui-style components** (Radix primitives + cva) in `components/ui`
- **Serwist** service worker — installable PWA with offline caching
- **Supabase** — scaffolded, not yet wired up (see below)

## Screens

| Route | Screen |
| --- | --- |
| `/` | **Today** — meals by slot, nutrition progress, quick-add |
| `/plan` | **Plan** — horizontal day selector + meal slots |
| `/recipes` | **Recipes** — search + filter chips + recipe cards |
| `/recipes/[id]` | Recipe detail — ingredients, steps, start cooking |
| `/cook/[id]` | **Cooking mode** — full-screen step-by-step instructions |
| `/grocery` | **Grocery** — categorized checklist with progress |
| `/profile` | **Profile** — goals + settings |

## Development

```bash
npm install
npm run dev        # http://localhost:3000 (service worker disabled in dev)
npm run build      # production build, generates public/sw.js
npm start
```

Tip: test the mobile experience with responsive dev tools set to an iPhone
viewport, or install it to your home screen from Safari (Share → Add to Home
Screen).

## Architecture

- `lib/types.ts` — domain types shared across the app
- `lib/data/index.ts` — **the data provider**. All screens read through these
  async functions; swap the implementations for Supabase queries without
  touching UI code.
- `lib/data/mock-data.ts` — mock content, only imported by the provider
- `lib/data/local-store.ts` — localStorage persistence for user actions
  (checked grocery items, eaten meals, quick-added meals); works offline
- `lib/supabase/client.ts` — Supabase client scaffold + integration notes
- `components/ui` — reusable shadcn-style primitives
- `components/<screen>` — screen-level components (client), rendered by thin
  server pages in `app/`

## Offline

The service worker (`app/sw.ts`) precaches the app shell — all five tabs and
the offline fallback — plus build assets. Since plan/recipe/grocery data
currently ships in the bundle, the whole app works offline after first load.
User state lives in localStorage. When Supabase lands, add a NetworkFirst
runtime route for its API and keep localStorage as the optimistic cache.

## Supabase (next step)

1. Copy `.env.example` to `.env.local` and fill in the project URL + anon key.
2. Create tables: `recipes`, `planned_meals`, `grocery_items`, `profiles`.
3. Reimplement `lib/data/index.ts` against `getSupabase()`.
