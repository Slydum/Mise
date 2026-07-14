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

## Deployment (GitHub Pages)

Pushes to `main` trigger `.github/workflows/deploy-pages.yml`, which builds a
static export (`STATIC_EXPORT=1`, `NEXT_PUBLIC_BASE_PATH=/Mise`) and deploys
`out/` to GitHub Pages at `https://<user>.github.io/Mise/`.

One-time setup: in the repo's **Settings → Pages**, set **Source** to
**GitHub Actions** (otherwise Pages keeps serving the README via Jekyll).

To reproduce the Pages build locally:

```bash
STATIC_EXPORT=1 NEXT_PUBLIC_BASE_PATH=/Mise npm run build   # outputs ./out
```

## Grocery pricing (SM Markets)

The Grocery screen shows package sizes and quantities for every ingredient,
but **there is no live SM Markets Online pricing in this app.** This is a
deliberate, honest state, not a missing feature waiting on API keys:

- SM Markets Online (`shop.smmarkets.ph`) publishes no public product/price
  API or developer program.
- This deployment is a static export on GitHub Pages, which has no server
  runtime — even a real data source couldn't be fetched per-request from
  here (see "Moving to a live server" below).
- A prior version of this app shipped a hand-curated table of *plausible*
  SM prices. That table has been removed from production entirely — it was
  never live data, and presenting it as "the SM total" was misleading. It
  survives only as fixtures inside test files (`lib/grocery/*.test.ts`),
  which is where estimated numbers belong.

What the app does instead:

- **Every `GroceryItem.livePriceStatus` is always `"unavailable"`.** Nothing
  in production ever fabricates a peso amount or shows ₱0 for a missing
  price. `lib/sm/adapter.ts` is the seam a real integration would plug into
  — every function in it returns `integration-unavailable` today.
- **Package math still works.** `lib/grocery/sm-packages.ts` keeps package
  *shapes* (e.g. "eggs are sold by the tray of 30") — that's a fact about
  retail packaging, not a price — so the app can still tell you "buy 1
  tray," it just can't tell you what that tray costs.
- **Purchase history, not price.** You can log what you actually paid after
  a shopping trip (`lib/grocery/purchase-history.ts`); it's shown as "Last
  paid ₱X on [date]," scoped to your selected store, and is never summed
  into a "current" basket total.
- **An exact store is required.** "SM Markets" alone isn't a price
  location — Profile → Shopping requires a specific branch (name + city,
  typed in — there's no live SM store directory to pick from either)
  before any pricing UI activates.

### What a real integration would need

1. **A server runtime.** Route Handlers under `app/api/` need a Node
   environment to run per-request — GitHub Pages' static export can't host
   them. Moving to Vercel (or any Node host) removes the `output: "export"`
   constraint in `next.config.ts` (see `STATIC_EXPORT` there) and lets
   `lib/sm/adapter.ts` actually make server-side requests, keeping any
   credentials out of the browser bundle.
2. **A real data source**, one of:
   - An official SM Markets API or partner/affiliate data feed, or
   - A manually-verified, rate-limited storefront integration built by
     directly inspecting `shop.smmarkets.ph` in a real browser — this
     needs a human to confirm what's actually publicly accessible without
     defeating login, CAPTCHA, or anti-bot controls, since that can't be
     done or verified from an automated sandbox. (This session's outbound
     web access is itself blocked at the environment level, independent of
     SM's own bot-detection posture — see the agent proxy's `403` policy.)
3. Wire the result into `lib/sm/adapter.ts` in place of the
   `integration-unavailable` stubs — `GroceryItem.livePriceStatus`,
   `liveTotalPricePhp`, `lib/grocery/basket.ts`, and the Grocery UI are
   already built to consume real freshness/status data the moment it
   exists; no call site should need to change.

## Supabase (next step)

1. Copy `.env.example` to `.env.local` and fill in the project URL + anon key.
2. Create tables: `recipes`, `planned_meals`, `grocery_items`, `profiles`.
3. Reimplement `lib/data/index.ts` against `getSupabase()`.
