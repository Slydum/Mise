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

## Grocery pricing (PSA / DTI / SM)

The Grocery screen shows package sizes and quantities for every ingredient,
and prices them against a unified official-data model in `lib/pricing/` —
but **there is no live connection to PSA, DTI, or SM Markets Online in this
app.** This is a deliberate, honest state, not a missing feature waiting on
API keys. It was verified directly, not assumed: this session's outbound web
access is blocked at the environment/proxy level for every external host
tried, including `openstat.psa.gov.ph`, `dti.gov.ph`, and
`shop.smmarkets.ph` — confirmed against a neutral control host too, so it's
an environment constraint, not something specific to any of these sites.

The pricing model (`lib/pricing/types.ts`'s `CommodityPrice`) unifies five
sources, in priority order:

1. **Receipt** — what you logged after actually buying something
2. **User-verified SM** — a price you manually confirmed is currently
   accurate at your branch, without necessarily buying
3. **DTI e-Presyo** — monitored basic-necessity/prime-commodity prices
4. **PSA Price Situationer** / **PSA OpenSTAT** — official market
   references, always the most locally-specific figure available (city →
   province → region → national, each labeled as such —
   `lib/pricing/geographic.ts`)

Only sources 1–2 have real data today, because they're the user's own
locally-stored input (`lib/grocery/purchase-history.ts`) — no network
access needed. Sources 3–4 are fully built (matching, geographic fallback,
freshness rules, per-kilogram calculations — all unit-tested in
`lib/pricing/*.test.ts`) but their adapters
(`lib/pricing/adapters/{psa-openstat,psa-situationer,dti-epresyo}.ts`)
honestly return `integration-unavailable` since there's nothing to fetch
from. Nothing in production ever fabricates a peso amount or shows ₱0 for a
missing price — a grocery row with no resolved price shows "Price
unavailable."

Key distinctions the app enforces everywhere:

- **A PSA/DTI reference is never labeled as an exact SM price.**
  `CommodityPrice.isExactStorePrice` is only ever `true` for a receipt or a
  user verification; PSA/DTI figures are commodity-level market references
  (`GroceryItem.priceInfo.isUsageReference`), not a checkout guarantee.
- **Materially different commodities are never merged.** Native vs.
  imported garlic, red vs. white onion, well-milled vs. regular-milled
  rice, fresh vs. canned tuna, salmon vs. tilapia all stay distinct in
  `lib/pricing/commodities.ts`'s mapping table — a missing mapping is
  `commodityName: null`, never a plausible-looking substitute.
- **An exact store is required for SM-specific pricing.** "SM Markets"
  alone isn't a price location — Profile → Shopping requires a specific
  branch (name + city, typed in — there's no live SM store directory to
  pick from either).
- **"Search prices online"** in the price-detail sheet opens a plain Google
  search in a new tab for the user to read themselves — Mise never reads,
  parses, or trusts search results as a price; it's purely a research aid
  before the user manually logs a number.

### What a real integration would need

1. **A server runtime.** Route Handlers under `app/api/` need a Node
   environment to run per-request — GitHub Pages' static export can't host
   them. Moving to Vercel (or any Node host) removes the `output: "export"`
   constraint in `next.config.ts` (see `STATIC_EXPORT` there) and lets the
   adapters actually make server-side requests, keeping any credentials out
   of the browser bundle.
2. **Real data sources**, per adapter:
   - PSA OpenSTAT/Price Situationer: PSA publishes retail-price tables and
     periodic releases; a real adapter needs whatever structured access PSA
     offers (bulk download, OpenSTAT query API, or a properly-authorized
     scraper someone builds after directly inspecting the site in a real
     browser — not assumed or guessed here).
   - DTI e-Presyo: same approach — consume structured data if DTI exposes
     it, otherwise an isolated parser for official downloadable
     files/pages, never bypassing auth/CAPTCHA/anti-bot controls.
   - SM Markets: an official API/partner feed, since SM publishes no public
     one.
3. **Supabase**, for server-persisted price history and a scheduled refresh
   job (daily PSA/DTI ingestion, rate-limited per user/store) — not
   connected in this build; see the Supabase section below. Until then,
   everything stays local-first via `lib/data/local-store.ts`.
4. Wire results into the relevant `lib/pricing/adapters/*.ts` file in place
   of its `integration-unavailable` stub — `lib/pricing/priority.ts`,
   `lib/grocery/basket.ts`, and the Grocery UI already consume real
   `CommodityPrice` data the moment an adapter produces it; no call site
   should need to change.

## Supabase (next step)

1. Copy `.env.example` to `.env.local` and fill in the project URL + anon key.
2. Create tables: `recipes`, `planned_meals`, `grocery_items`, `profiles`.
3. Reimplement `lib/data/index.ts` against `getSupabase()`.
