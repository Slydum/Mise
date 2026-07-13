import type { MealType, PlannedMeal } from "@/lib/types";

/**
 * Lightweight client-side persistence for user actions (checked grocery
 * items, meals marked as eaten, quick-added meals). Backed by localStorage so
 * everything keeps working offline; when Supabase lands this becomes the
 * optimistic local cache that syncs upward.
 */

const KEYS = {
  groceryChecked: "mise.grocery.checked.v1",
  completedMeals: "mise.meals.completed.v1",
  extraMeals: "mise.meals.extra.v1",
} as const;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable — fail silently, state stays in memory.
  }
}

// Grocery checklist -----------------------------------------------------------

export function loadCheckedItems(): Record<string, boolean> {
  return read(KEYS.groceryChecked, {});
}

export function saveCheckedItems(map: Record<string, boolean>): void {
  write(KEYS.groceryChecked, map);
}

// Completed ("eaten") meals ---------------------------------------------------

export function loadCompletedMeals(): Record<string, boolean> {
  return read(KEYS.completedMeals, {});
}

export function saveCompletedMeals(map: Record<string, boolean>): void {
  write(KEYS.completedMeals, map);
}

// Quick-added meals, grouped by date key --------------------------------------

type ExtraMealsByDate = Record<string, PlannedMeal[]>;

export function loadExtraMeals(dateKey: string): PlannedMeal[] {
  return read<ExtraMealsByDate>(KEYS.extraMeals, {})[dateKey] ?? [];
}

export function addExtraMeal(dateKey: string, mealType: MealType, recipeId: string): PlannedMeal {
  const all = read<ExtraMealsByDate>(KEYS.extraMeals, {});
  const meal: PlannedMeal = {
    id: `extra-${dateKey}-${mealType}-${Date.now()}`,
    date: dateKey,
    mealType,
    recipeId,
  };
  all[dateKey] = [...(all[dateKey] ?? []), meal];
  write(KEYS.extraMeals, all);
  return meal;
}
