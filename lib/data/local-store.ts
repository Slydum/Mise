import type { BudgetLevel, DietaryStyle, MealType, PlannedMeal } from "@/lib/types";
import { DEFAULT_DIETARY_STYLE } from "@/lib/types";

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
  favorites: "mise.recipes.favorites.v1",
  water: "mise.water.v1",
  activeCook: "mise.cook.active.v1",
  ingredientChecks: "mise.recipe.ingredients.v1",
  dietaryStyle: "mise.profile.dietaryStyle.v1",
  allergies: "mise.profile.allergies.v1",
  excludedIngredients: "mise.profile.excludedIngredients.v1",
  favoriteIngredients: "mise.profile.favoriteIngredients.v1",
  preferredCuisines: "mise.profile.preferredCuisines.v1",
  maxCookMinutes: "mise.profile.maxCookMinutes.v1",
  budgetPreference: "mise.profile.budgetPreference.v1",
  servings: "mise.profile.servings.v1",
  calorieGoal: "mise.profile.calorieGoal.v1",
  proteinGoal: "mise.profile.proteinGoal.v1",
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

// Saved recipes ---------------------------------------------------------------

export function loadFavorites(): Record<string, boolean> {
  return read(KEYS.favorites, {});
}

export function toggleFavorite(recipeId: string): Record<string, boolean> {
  const next = { ...loadFavorites() };
  if (next[recipeId]) delete next[recipeId];
  else next[recipeId] = true;
  write(KEYS.favorites, next);
  return next;
}

// Hydration, logged in milliliters per date key --------------------------------

type WaterByDate = Record<string, number>;

export function loadWaterMl(dateKey: string): number {
  return read<WaterByDate>(KEYS.water, {})[dateKey] ?? 0;
}

export function addWaterMl(dateKey: string, amountMl: number): number {
  const all = read<WaterByDate>(KEYS.water, {});
  const next = Math.max(0, (all[dateKey] ?? 0) + amountMl);
  all[dateKey] = next;
  write(KEYS.water, all);
  return next;
}

// In-progress cooking session, so Today can offer "Continue cooking" ----------

export interface ActiveCook {
  recipeId: string;
  stepIndex: number;
  updatedAt: number;
}

export function loadActiveCook(): ActiveCook | null {
  return read<ActiveCook | null>(KEYS.activeCook, null);
}

export function saveActiveCook(recipeId: string, stepIndex: number): void {
  write(KEYS.activeCook, { recipeId, stepIndex, updatedAt: Date.now() } satisfies ActiveCook);
}

export function clearActiveCook(): void {
  write(KEYS.activeCook, null);
}

// Ingredient checklist, per recipe ---------------------------------------------

type IngredientChecksByRecipe = Record<string, Record<string, boolean>>;

export function loadIngredientChecks(recipeId: string): Record<string, boolean> {
  return read<IngredientChecksByRecipe>(KEYS.ingredientChecks, {})[recipeId] ?? {};
}

export function saveIngredientChecks(recipeId: string, map: Record<string, boolean>): void {
  const all = read<IngredientChecksByRecipe>(KEYS.ingredientChecks, {});
  all[recipeId] = map;
  write(KEYS.ingredientChecks, all);
}

// Food preferences --------------------------------------------------------------

export function loadDietaryStyle(): DietaryStyle {
  return read(KEYS.dietaryStyle, DEFAULT_DIETARY_STYLE);
}

export function saveDietaryStyle(style: DietaryStyle): void {
  write(KEYS.dietaryStyle, style);
}

export function loadAllergies(): string[] {
  return read(KEYS.allergies, []);
}

export function saveAllergies(values: string[]): void {
  write(KEYS.allergies, values);
}

export function loadExcludedIngredients(): string[] {
  return read(KEYS.excludedIngredients, []);
}

export function saveExcludedIngredients(values: string[]): void {
  write(KEYS.excludedIngredients, values);
}

export function loadFavoriteIngredients(): string[] {
  return read(KEYS.favoriteIngredients, []);
}

export function saveFavoriteIngredients(values: string[]): void {
  write(KEYS.favoriteIngredients, values);
}

export function loadPreferredCuisines(): string[] {
  return read(KEYS.preferredCuisines, []);
}

export function savePreferredCuisines(values: string[]): void {
  write(KEYS.preferredCuisines, values);
}

/** `null` means no cap. */
export function loadMaxCookMinutes(): number | null {
  return read<number | null>(KEYS.maxCookMinutes, null);
}

export function saveMaxCookMinutes(value: number | null): void {
  write(KEYS.maxCookMinutes, value);
}

/** `null` means no preference. */
export function loadBudgetPreference(): BudgetLevel | null {
  return read<BudgetLevel | null>(KEYS.budgetPreference, null);
}

export function saveBudgetPreference(value: BudgetLevel | null): void {
  write(KEYS.budgetPreference, value);
}

/**
 * Number of people the plan should serve. Stored and editable in Profile;
 * intentionally not yet wired into recipe scaling, grocery quantities, or
 * ranking — household-aware planning is out of scope for now (see
 * PlanPreferences/RankingPreferences, which don't take a servings field).
 */
export function loadServings(): number {
  return read(KEYS.servings, 2);
}

export function saveServings(value: number): void {
  write(KEYS.servings, value);
}

/** `null` means use the profile default. */
export function loadCalorieGoal(): number | null {
  return read<number | null>(KEYS.calorieGoal, null);
}

export function saveCalorieGoal(value: number | null): void {
  write(KEYS.calorieGoal, value);
}

/** `null` means use the profile default. */
export function loadProteinGoal(): number | null {
  return read<number | null>(KEYS.proteinGoal, null);
}

export function saveProteinGoal(value: number | null): void {
  write(KEYS.proteinGoal, value);
}
