import { getCanonicalKey } from "@/lib/grocery/ingredient-catalog";
import { toBaseAmount } from "@/lib/grocery/units";
import type { GroceryCategory, Ingredient } from "@/lib/types";

export interface UsageLine {
  canonicalKey: string;
  displayName: string;
  amount: number;
  baseUnit: string;
  category: GroceryCategory;
}

export interface AggregateEntry {
  ingredient: Ingredient;
  /** e.g. desired servings / recipe's base servings. Defaults to 1 at every current call site — no per-meal serving override exists yet — but the function scales correctly for any ratio. */
  servingsRatio: number;
}

/** Scales a single ingredient's usage amount by a servings ratio. */
export function scaleUsage(ingredient: Ingredient, ratio: number): Ingredient {
  return { ...ingredient, amount: ingredient.amount * ratio };
}

/**
 * Scales and merges ingredient usage across every planned recipe into one
 * line per canonical-ingredient-and-unit-family, converting compatible
 * metric units (g/kg, ml/L) before summing. Three recipes each calling for
 * plain "onion" produce exactly one combined line.
 */
export function aggregateIngredients(entries: AggregateEntry[]): UsageLine[] {
  const combined = new Map<string, UsageLine>();

  for (const { ingredient, servingsRatio } of entries) {
    const scaled = scaleUsage(ingredient, servingsRatio);
    const canonicalKey = getCanonicalKey(scaled.name);
    const { amount, baseUnit } = toBaseAmount(scaled.amount, scaled.unit);
    const key = `${canonicalKey}::${baseUnit}`;

    const existing = combined.get(key);
    if (existing) {
      existing.amount += amount;
    } else {
      combined.set(key, {
        canonicalKey,
        displayName: scaled.name,
        amount,
        baseUnit,
        category: scaled.category,
      });
    }
  }

  return Array.from(combined.values());
}

/** Removes any line whose canonical key matches something in the pantry. */
export function filterOutPantryItems<T extends { canonicalKey: string }>(
  items: T[],
  pantryNames: string[],
): T[] {
  const pantryKeys = new Set(pantryNames.map(getCanonicalKey));
  return items.filter((item) => !pantryKeys.has(item.canonicalKey));
}
