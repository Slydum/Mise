import type { GroceryCategory, PlannedMeal, Recipe, Unit } from "@/lib/types";
import { PRICE_CATALOG, type PriceCatalogEntry } from "@/lib/data/sm-price-catalog";

/** Normalizes an ingredient name to the key ingredients are merged/priced by. */
export function canonicalKey(name: string): string {
  return name.trim().toLowerCase();
}

/** Formats a peso amount for display, e.g. `formatPhp(1234.5)` -> "₱1,235". */
export function formatPhp(amount: number): string {
  return `₱${Math.round(amount).toLocaleString()}`;
}

// Warn (once per key, dev only) when a recipe ingredient has no matching
// catalog entry, or disagrees on unit — otherwise it silently prices at ₱0
// with a meaningless package label instead of surfacing the data gap.
const warnedCatalogKeys = new Set<string>();
function checkCatalogEntry(key: string, name: string, unit: Unit, entry: PriceCatalogEntry | undefined): void {
  if (process.env.NODE_ENV === "production" || warnedCatalogKeys.has(key)) return;
  if (!entry) {
    warnedCatalogKeys.add(key);
    console.warn(`[grocery] No SM price catalog entry for "${name}" (key "${key}") — will price at ₱0.`);
  } else if (entry.unit !== unit) {
    warnedCatalogKeys.add(key);
    console.warn(
      `[grocery] "${name}" is recorded in ${unit} but its catalog entry uses ${entry.unit} — quantities won't merge correctly.`,
    );
  }
}

export interface GroceryLine {
  key: string;
  name: string;
  category: GroceryCategory;
  unit: Unit;
  /** Amount still needed after any pantry credit, in `unit` — always > 0 (fully-covered lines are omitted). */
  neededAmount: number;
  packagesNeeded: number;
  packageLabel: string;
  /** e.g. "2 × 1 can (400 g)", or just "1 can (400 g)" when only one package is needed. */
  displayQuantity: string;
  unitPricePhp: number;
  lineTotalPhp: number;
  /** True if a pantry staple default (or an explicit "have it" mark) reduced this line. */
  pantryCredited: boolean;
}

export interface GroceryList {
  lines: GroceryLine[];
  basketTotalPhp: number;
  totalServings: number;
  costPerServingPhp: number;
  costPerDayPhp: number;
  horizonDays: number;
}

interface BuildGroceryListParams {
  /** All planned + quick-added meals across the shopping horizon. */
  meals: PlannedMeal[];
  recipesById: Map<string, Recipe>;
  /** Meals already marked eaten — already shopped/cooked for, excluded from need. */
  completedMealIds: Set<string>;
  householdSize: number;
  /**
   * Explicit user overrides, keyed by canonicalKey: `true` = "I have enough,
   * don't list it", `false` = "I don't have this, ignore the staple default".
   * Absent = use the algorithmic default (see pantryStaple below).
   */
  pantryOverrides: Record<string, boolean>;
  horizonDays: number;
}

function formatDisplayQuantity(packagesNeeded: number, entry: PriceCatalogEntry | undefined): string {
  const label = entry?.packageLabel ?? "1 pc";
  return packagesNeeded <= 1 ? label : `${packagesNeeded} × ${label}`;
}

/**
 * Derives a shopping-ready grocery list from a set of planned meals:
 * merges duplicate ingredients across recipes (by canonical name), converts
 * to a shared unit, scales by household size, batches recipes that yield
 * more servings than a single occurrence needs (so a 4-serving soup cooked
 * once still covers every planned occurrence that week — the "leftovers"
 * reduce what's bought), subtracts pantry stock, and rounds up to whole
 * purchasable packages using the SM price catalog.
 *
 * Completed (already-eaten) meals are excluded entirely — their groceries
 * were already needed and used by an earlier cook.
 */
export function buildGroceryList({
  meals,
  recipesById,
  completedMealIds,
  householdSize,
  pantryOverrides,
  horizonDays,
}: BuildGroceryListParams): GroceryList {
  const upcoming = meals.filter((meal) => !completedMealIds.has(meal.id));

  const occurrencesByRecipe = new Map<string, number>();
  for (const meal of upcoming) {
    occurrencesByRecipe.set(meal.recipeId, (occurrencesByRecipe.get(meal.recipeId) ?? 0) + 1);
  }

  const rawNeeded = new Map<
    string,
    { amount: number; name: string; category: GroceryCategory; unit: Unit }
  >();

  for (const [recipeId, occurrences] of occurrencesByRecipe) {
    const recipe = recipesById.get(recipeId);
    if (!recipe) continue;
    const servingsNeeded = occurrences * householdSize;
    // Leftover-aware batching: don't cook (or buy for) the recipe once per
    // occurrence if its own yield already covers multiple occurrences.
    const timesCooked = Math.max(1, Math.ceil(servingsNeeded / recipe.servings));
    for (const ingredient of recipe.ingredients) {
      const key = canonicalKey(ingredient.name);
      const entry = rawNeeded.get(key) ?? {
        amount: 0,
        name: ingredient.name,
        category: ingredient.category,
        unit: ingredient.unit,
      };
      entry.amount += ingredient.amount * timesCooked;
      rawNeeded.set(key, entry);
    }
  }

  const lines: GroceryLine[] = [];
  let basketTotalPhp = 0;

  for (const [key, need] of rawNeeded) {
    const catalogEntry = PRICE_CATALOG[key];
    checkCatalogEntry(key, need.name, need.unit, catalogEntry);
    const override = pantryOverrides[key];

    if (override === true) continue; // user says they already have enough

    let pantryCredit = 0;
    let pantryCredited = false;
    if (catalogEntry?.pantryStaple && override !== false) {
      // Assume a typical household already has ~1 package of this staple —
      // avoids "buy 3 bottles of soy sauce" just because 3 recipes use a splash.
      pantryCredit = catalogEntry.packageAmount;
      pantryCredited = true;
    }

    const remaining = Math.max(0, need.amount - pantryCredit);
    if (remaining <= 0) continue; // fully covered by pantry

    const packageAmount = catalogEntry?.packageAmount ?? remaining;
    const packagesNeeded = Math.max(1, Math.ceil(remaining / packageAmount));
    const unitPricePhp = catalogEntry?.pricePhp ?? 0;
    const lineTotalPhp = packagesNeeded * unitPricePhp;
    basketTotalPhp += lineTotalPhp;

    lines.push({
      key,
      name: catalogEntry?.name ?? need.name,
      category: catalogEntry?.category ?? need.category,
      unit: need.unit,
      neededAmount: remaining,
      packagesNeeded,
      packageLabel: catalogEntry?.packageLabel ?? "1 pc",
      displayQuantity: formatDisplayQuantity(packagesNeeded, catalogEntry),
      unitPricePhp,
      lineTotalPhp,
      pantryCredited,
    });
  }

  lines.sort((a, b) => a.name.localeCompare(b.name));

  const totalServings = upcoming.length * householdSize;

  return {
    lines,
    basketTotalPhp,
    totalServings,
    costPerServingPhp: totalServings > 0 ? basketTotalPhp / totalServings : 0,
    costPerDayPhp: horizonDays > 0 ? basketTotalPhp / horizonDays : 0,
    horizonDays,
  };
}

export interface DaySummary {
  mealCount: number;
  completedCount: number;
  estimatedCostPhp: number;
}

/**
 * A quick, independent per-day cost estimate for the week view — scales each
 * meal's own ingredients to household size and prices them directly (no
 * cross-day batching or pantry credit beyond skipping staples entirely), so
 * it won't reconcile exactly to the peso with the batched weekly total. It's
 * meant as a rough "about how much today's meals cost" badge, not a ledger.
 */
export function summarizeDay(
  meals: PlannedMeal[],
  recipesById: Map<string, Recipe>,
  completedMealIds: Set<string>,
  householdSize: number,
): DaySummary {
  let estimatedCostPhp = 0;
  let completedCount = 0;

  for (const meal of meals) {
    if (completedMealIds.has(meal.id)) completedCount++;
    const recipe = recipesById.get(meal.recipeId);
    if (!recipe) continue;
    const scale = householdSize / recipe.servings;
    for (const ingredient of recipe.ingredients) {
      const key = canonicalKey(ingredient.name);
      const catalogEntry = PRICE_CATALOG[key];
      checkCatalogEntry(key, ingredient.name, ingredient.unit, catalogEntry);
      if (!catalogEntry || catalogEntry.pantryStaple) continue;
      const scaledAmount = ingredient.amount * scale;
      const packagesNeeded = Math.max(1, Math.ceil(scaledAmount / catalogEntry.packageAmount));
      estimatedCostPhp += packagesNeeded * catalogEntry.pricePhp;
    }
  }

  return { mealCount: meals.length, completedCount, estimatedCostPhp };
}
