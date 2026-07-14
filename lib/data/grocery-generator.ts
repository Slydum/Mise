import { resolveDayMeals } from "@/lib/data/plan-overrides";
import { addDays, fromDateKey, toDateKey, todayKey } from "@/lib/dates";
import type { DietaryStyle, GroceryItem } from "@/lib/types";

const GENERATION_DAYS = 7;

/**
 * Case/whitespace-normalized identity for combining duplicate ingredients
 * across recipes. Deliberately conservative — it does NOT strip descriptive
 * words like "red" or "fresh", since two differently-qualified ingredients
 * (e.g. "Red onion" vs "Onion") may genuinely be different purchases. Exact
 * (case-insensitive) name matches, like three recipes all calling for plain
 * "Onion", combine into one line; anything more fuzzy is left separate
 * rather than risking an incorrect merge.
 */
export function normalizeIngredientName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Derives a grocery list from the meals actually planned for the next 7 days
 * (today onward — buying for days already passed makes no sense), combining
 * same-named-and-unit ingredients across recipes. Pantry exclusion is applied
 * by the caller (lib/hooks/use-grocery-list.ts) uniformly across both
 * generated and manually-added items, not baked in here. Ids are stable
 * across regenerations (derived from the normalized name+unit, not random),
 * so check-off state in the `groceryChecked` store keeps working as the plan
 * changes day to day.
 */
export async function generateGroceryItems(dietaryStyle: DietaryStyle): Promise<GroceryItem[]> {
  const start = fromDateKey(todayKey());
  const dateKeys = Array.from({ length: GENERATION_DAYS }, (_, i) => toDateKey(addDays(start, i)));
  const dayMeals = await Promise.all(dateKeys.map((key) => resolveDayMeals(key, dietaryStyle)));

  const combined = new Map<string, GroceryItem>();

  for (const meals of dayMeals) {
    for (const meal of meals) {
      for (const ingredient of meal.recipe.ingredients) {
        const normalizedName = normalizeIngredientName(ingredient.name);
        const key = `${normalizedName}::${ingredient.unit.toLowerCase()}`;
        const existing = combined.get(key);
        if (existing) {
          existing.amount += ingredient.amount;
        } else {
          combined.set(key, {
            id: `gen-${key.replace(/\s+/g, "-")}`,
            name: ingredient.name,
            amount: ingredient.amount,
            unit: ingredient.unit,
            category: ingredient.category,
          });
        }
      }
    }
  }

  return Array.from(combined.values());
}
