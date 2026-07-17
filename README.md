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

## Grocery pricing (PSA / DTI / your own stores)

The Grocery screen shows package sizes and quantities for every ingredient,
and prices them against a unified official-data model in `lib/pricing/` —
but **there is no live connection to PSA, DTI, or any supermarket's live
checkout prices in this app.** This is a deliberate, honest state, not a
missing feature waiting on API keys. It was verified directly, not assumed:
this session's outbound web access is blocked at the environment/proxy
level for every external host tried, including `openstat.psa.gov.ph`,
`dti.gov.ph`, and `shop.smmarkets.ph` — confirmed against a neutral control
host too, so it's an environment constraint, not something specific to any
of these sites.

The pricing model (`lib/pricing/types.ts`'s `CommodityPrice`) unifies five
sources, in priority order:

1. **Receipt** — what you logged after actually buying something
2. **User-verified** — a price you manually confirmed is currently accurate
   at a store, without necessarily buying
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

### Any store, not just one

Profile → Shopping keeps a list of every store the user has added
(`ShoppingSettings.stores`, see `lib/types.ts`) — any supermarket, not one
fixed "preferred" branch. One store is marked `currentStoreId`, which
decides which store's prices show on the Grocery screen and basket total by
default; tapping another store in the list switches it. Logging a price
(receipt or verification) from the price-detail sheet isn't limited to the
current store either — an inline chip picker lets you name any store,
including a brand-new one typed on the spot, which is then added to the
list automatically. A price logged at one store never leaks into another
(`lib/pricing/priority.ts`'s `storeId` match), and the label always names
the exact store ("Last paid at Puregold Imus," "Verified at SM Supermarket
Fairview" — built per-price in
`lib/pricing/adapters/user-verified.ts`, never a generic "SM" label).

Key distinctions the app enforces everywhere:

- **A PSA/DTI reference is never labeled as an exact store price.**
  `CommodityPrice.isExactStorePrice` is only ever `true` for a receipt or a
  user verification; PSA/DTI figures are commodity-level market references
  (`GroceryItem.priceInfo.isUsageReference`), not a checkout guarantee.
- **Materially different commodities are never merged.** Native vs.
  imported garlic, red vs. white onion, well-milled vs. regular-milled
  rice, fresh vs. canned tuna, salmon vs. tilapia all stay distinct in
  `lib/pricing/commodities.ts`'s mapping table — a missing mapping is
  `commodityName: null`, never a plausible-looking substitute.
- **An exact store is required for store-specific pricing.** A chain name
  alone ("SM Markets," "Puregold") isn't a price location — every store in
  Profile → Shopping (or named while logging a price) needs its specific
  branch: name + city, typed in — there's no live store directory to pick
  from for arbitrary chains, though nearby SM branches specifically can be
  found via OpenStreetMap search (see below).
- **"Search prices online"** in the price-detail sheet opens a plain Google
  search in a new tab for the user to read themselves — Mise never reads,
  parses, or trusts search results as a price; it's purely a research aid
  before the user manually logs a number.
- **Receipt scanning** runs on-device OCR (Tesseract.js, `lib/ocr/receipt-
  ocr.ts`) on a photo and surfaces every price-shaped number it finds as a
  tappable chip — it never auto-fills or auto-saves a price, and never
  guesses which number belongs to which item (a real receipt has a price
  per line plus subtotal/cash/change, all of which are price-shaped;
  matching one to "avocado" specifically isn't something OCR text alone can
  tell). Each candidate chip shows the OCR'd line it came from, so a wall
  of numbers like "₱69 / ₱31 / ₱62 / ₱38" reads instead as "AVOCADO HASS
  69.00/kg 31.19" vs. "BANANA LAKATAN 62.00/kg 38.44" — legible enough to
  pick the right one without guessing. Two entry points: the price-detail
  sheet scans for one item, or the Grocery screen's receipt icon
  (`components/grocery/receipt-scan-sheet.tsx`) scans once and lets you
  assign different prices on the same receipt to different grocery items
  in one pass, so a single photo can log an entire trip instead of
  reopening every item's sheet. Like the location features below, this is
  genuinely functional in the deployed app (it needs no server), but it
  does need real internet access the first time it runs, since
  Tesseract.js fetches its language data from a CDN — cached in the
  browser afterward. Not verified end-to-end from this coding session for
  the same network-access reason as everywhere else in this doc; verified
  instead is the pure candidate-extraction logic
  (`lib/ocr/receipt-ocr.test.ts`, including against a real receipt's OCR
  text) and that a failed OCR read degrades gracefully to manual entry
  rather than getting stuck or crashing the sheet.
- **Weighed produce gets a per-kg rate, not a fixed piece price.** Many
  Philippine supermarkets price produce like avocado by weight (e.g.
  ₱69/kg), not per piece. Logging a price offers a "Priced per kilogram" /
  "per liter" choice alongside the default "whole purchase" price
  (`PurchaseRecord.pricingKind`, `CommodityPrice.isWeighted`) — a weighted
  rate applies no matter how much is bought, the same way a PSA reference
  does, and only prices a grocery line when its needed amount is itself
  weight-based (grams/kg or ml/L); a piece-counted usage line (e.g. "1
  avocado" with no weight) honestly stays "Price unavailable" rather than
  inventing an average weight per piece.

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

## Location & nearby SM store detection

Profile → Shopping has a "Use my location" button (`lib/geolocation.ts`) and a
"Find nearby SM stores" button (`lib/pricing/sm-locator.ts`). Unlike the
PSA/DTI/SM price adapters above, **this feature is genuinely live** — it
needs no server and no data partnership, because it runs entirely in the
end user's own browser, which has normal internet access even though this
coding session's outbound access is blocked.

- **"Use my location"** calls `navigator.geolocation.getCurrentPosition()`,
  then reverse-geocodes the coordinates via OpenStreetMap's Nominatim API
  (`lib/pricing/geocoding.ts`) to prefill Region/Province/City — never
  overwriting a field Nominatim didn't actually return
  (`mapNominatimAddress` is pure and unit-tested against that).
- **"Find nearby SM stores"** queries OpenStreetMap's Overpass API for
  supermarkets/hypermarkets/department stores named SM/Savemore near the
  user's coordinates, ranks them by great-circle distance
  (`haversineDistanceMeters`), and lists them for the user to tap.
  Selecting a result only prefills the store-name/city/address fields —
  saving still requires the user to press "Save store," so nothing is
  auto-applied.
- Both are **community-sourced, best-effort data**, labeled as such in the
  UI ("Location lookup powered by OpenStreetMap." /
  "Store search powered by OpenStreetMap community data — coverage isn't
  guaranteed complete; confirm below before saving.") — coverage of any
  given SM branch on OpenStreetMap isn't guaranteed, so the free-text
  fields remain the source of truth and manual entry still works exactly
  as before.
- Nominatim's usage policy expects a proper `User-Agent` and light,
  occasional use; browsers block client JS from setting that header. This
  is acceptable for a single user's manual, button-triggered lookups, but
  is worth revisiting (a self-hosted instance or a paid geocoding
  provider) if the app gains real traffic.

## Supabase (next step)

1. Copy `.env.example` to `.env.local` and fill in the project URL + anon key.
2. Create tables: `recipes`, `planned_meals`, `grocery_items`, `profiles`.
3. Reimplement `lib/data/index.ts` against `getSupabase()`.
