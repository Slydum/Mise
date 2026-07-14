import { aggregateIngredients, filterOutPantryItems, type AggregateEntry } from "@/lib/grocery/aggregate";
import { buildGroceryItems } from "@/lib/grocery/packages";
import { resolveDayMeals } from "@/lib/data/plan-overrides";
import { loadPantryItems } from "@/lib/data/local-store";
import { addDays, fromDateKey, toDateKey, todayKey } from "@/lib/dates";
import type { DietaryStyle, GroceryItem } from "@/lib/types";

const GENERATION_DAYS = 7;

/**
 * Derives a grocery list from the meals actually planned for the next 7 days
 * (today onward — buying for days already passed makes no sense). Ingredient
 * scaling, canonical-name merging, metric-unit conversion, pantry
 * subtraction, and the usage-vs-purchase package split all live in
 * lib/grocery/ (unit-tested there) — this function's job is just gathering
 * "what's planned" into the entries that pipeline expects.
 */
export async function generateGroceryItems(dietaryStyle: DietaryStyle): Promise<GroceryItem[]> {
  const start = fromDateKey(todayKey());
  const dateKeys = Array.from({ length: GENERATION_DAYS }, (_, i) => toDateKey(addDays(start, i)));
  const dayMeals = await Promise.all(dateKeys.map((key) => resolveDayMeals(key, dietaryStyle)));

  const entries: AggregateEntry[] = [];
  for (const meals of dayMeals) {
    for (const meal of meals) {
      for (const ingredient of meal.recipe.ingredients) {
        entries.push({ ingredient, servingsRatio: 1 });
      }
    }
  }

  const usageLines = aggregateIngredients(entries);
  const remaining = filterOutPantryItems(usageLines, loadPantryItems());
  return buildGroceryItems(remaining);
}
