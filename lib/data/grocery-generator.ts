import { aggregateIngredients, filterOutPantryItems, type AggregateEntry } from "@/lib/grocery/aggregate";
import { buildGroceryItems } from "@/lib/grocery/packages";
import { purchaseRecordsToCommodityPrices } from "@/lib/pricing/adapters/user-verified";
import { psaOpenStatAdapter } from "@/lib/pricing/adapters/psa-openstat";
import { psaSituationerAdapter } from "@/lib/pricing/adapters/psa-situationer";
import { dtiEpresyoAdapter } from "@/lib/pricing/adapters/dti-epresyo";
import type { CommodityPrice, PriceAdapterParams } from "@/lib/pricing/types";
import { resolveDayMeals } from "@/lib/data/plan-overrides";
import { loadPantryItems, loadPurchaseHistory } from "@/lib/data/local-store";
import { addDays, fromDateKey, toDateKey, todayKey } from "@/lib/dates";
import type { DietaryStyle, GroceryItem } from "@/lib/types";

const GENERATION_DAYS = 7;

/**
 * Gathers every priced candidate for this week's ingredients from every
 * pricing source (see lib/pricing/): PSA OpenSTAT, PSA Price Situationer,
 * and DTI e-Presyo — all of which honestly return no data today, since
 * there's no live connection (see lib/pricing/adapters/*.ts) — plus the
 * user's own local purchase history, the only source with real data.
 */
async function gatherPriceCandidates(
  location: PriceAdapterParams,
  displayNameByKey: Map<string, string>,
): Promise<CommodityPrice[]> {
  const [psaOpenStat, psaSituationer, dti] = await Promise.all([
    psaOpenStatAdapter.fetchPrices(location),
    psaSituationerAdapter.fetchPrices(location),
    dtiEpresyoAdapter.fetchPrices(location),
  ]);
  const userVerified = purchaseRecordsToCommodityPrices(
    loadPurchaseHistory(),
    (canonicalKey) => displayNameByKey.get(canonicalKey) ?? canonicalKey,
  );
  return [...psaOpenStat.prices, ...psaSituationer.prices, ...dti.prices, ...userVerified];
}

/**
 * Derives a grocery list from the meals actually planned for the next 7 days
 * (today onward — buying for days already passed makes no sense). Ingredient
 * scaling, canonical-name merging, metric-unit conversion, pantry
 * subtraction, and the usage-vs-purchase package split all live in
 * lib/grocery/ (unit-tested there) — this function's job is just gathering
 * "what's planned" into the entries that pipeline expects.
 *
 * `desiredServings` (the household size, see lib/types.ts's
 * ShoppingSettings) scales each recipe's ingredients relative to its own
 * base servings — a recipe written for 4 servings feeding a household of 2
 * scales every ingredient by 2/4, not by 1.
 *
 * `storeId` scopes which purchase-history records count as an exact SM
 * price; `location` (region/province/city) scopes PSA/DTI lookups. Neither
 * is required to see quantities — only to see pricing (see
 * ShoppingSettings in lib/types.ts).
 */
export async function generateGroceryItems(
  dietaryStyle: DietaryStyle,
  desiredServings: number,
  storeId: string | null,
  location: PriceAdapterParams = {},
): Promise<GroceryItem[]> {
  const start = fromDateKey(todayKey());
  const dateKeys = Array.from({ length: GENERATION_DAYS }, (_, i) => toDateKey(addDays(start, i)));
  const dayMeals = await Promise.all(dateKeys.map((key) => resolveDayMeals(key, dietaryStyle)));

  const entries: AggregateEntry[] = [];
  const displayNameByKey = new Map<string, string>();
  for (const meals of dayMeals) {
    for (const meal of meals) {
      const servingsRatio = meal.recipe.servings > 0 ? desiredServings / meal.recipe.servings : 1;
      for (const ingredient of meal.recipe.ingredients) {
        entries.push({ ingredient, servingsRatio });
        displayNameByKey.set(ingredient.name.trim().toLowerCase(), ingredient.name);
      }
    }
  }

  const usageLines = aggregateIngredients(entries);
  const remaining = filterOutPantryItems(usageLines, loadPantryItems());
  for (const line of remaining) displayNameByKey.set(line.canonicalKey, line.displayName);

  const priceCandidates = await gatherPriceCandidates(location, displayNameByKey);
  return buildGroceryItems(remaining, storeId, priceCandidates);
}
