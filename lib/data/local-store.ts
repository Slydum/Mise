import type { DietaryStyle, LeftoverEntry, MealType, PlannedMeal, Recipe } from "@/lib/types";
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
  planSlotOverrides: "mise.plan.overrides.v1",
  planRegenSeed: "mise.plan.regenSeed.v1",
  customRecipes: "mise.recipes.custom.v1",
  leftovers: "mise.leftovers.v1",
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

export function addExtraMeal(
  dateKey: string,
  mealType: MealType,
  recipeId: string,
  opts?: { isLeftover?: boolean; sourceLeftoverId?: string },
): PlannedMeal {
  const all = read<ExtraMealsByDate>(KEYS.extraMeals, {});
  const meal: PlannedMeal = {
    id: `extra-${dateKey}-${mealType}-${Date.now()}`,
    date: dateKey,
    mealType,
    recipeId,
    ...(opts?.isLeftover ? { isLeftover: true } : {}),
    ...(opts?.sourceLeftoverId ? { sourceLeftoverId: opts.sourceLeftoverId } : {}),
  };
  all[dateKey] = [...(all[dateKey] ?? []), meal];
  write(KEYS.extraMeals, all);
  return meal;
}

export function removeExtraMeal(dateKey: string, mealId: string): void {
  const all = read<ExtraMealsByDate>(KEYS.extraMeals, {});
  all[dateKey] = (all[dateKey] ?? []).filter((m) => m.id !== mealId);
  write(KEYS.extraMeals, all);
}

export function clearExtraMeals(dateKey: string): void {
  const all = read<ExtraMealsByDate>(KEYS.extraMeals, {});
  delete all[dateKey];
  write(KEYS.extraMeals, all);
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

// Plan slot overrides ----------------------------------------------------------
// Governs the single deterministic rotation slot for a given `${date}-${mealType}`
// key: a `recipeId` string substitutes the rotation's pick, `recipeId: null`
// removes it with no replacement, and an absent key means "show the rotation
// pick as-is." Separate from extraMeals, which is an unbounded additive stack
// on top of whatever a slot resolves to.

export interface SlotOverride {
  recipeId: string | null;
  isLeftover?: boolean;
  sourceLeftoverId?: string;
}

type SlotOverridesMap = Record<string, SlotOverride>;

export function loadSlotOverrides(): SlotOverridesMap {
  return read(KEYS.planSlotOverrides, {});
}

export function saveSlotOverride(slotId: string, override: SlotOverride): void {
  const all = read<SlotOverridesMap>(KEYS.planSlotOverrides, {});
  all[slotId] = override;
  write(KEYS.planSlotOverrides, all);
}

// Regeneration seed, per date key -----------------------------------------------
// The rotation is deterministic per day-of-week, so "Regenerate day" needs its
// own entropy source to produce a different result on repeat taps.

export function loadRegenSeed(dateKey: string): number {
  return read<Record<string, number>>(KEYS.planRegenSeed, {})[dateKey] ?? 0;
}

export function bumpRegenSeed(dateKey: string): number {
  const all = read<Record<string, number>>(KEYS.planRegenSeed, {});
  const next = (all[dateKey] ?? 0) + 1;
  all[dateKey] = next;
  write(KEYS.planRegenSeed, all);
  return next;
}

// Custom (user-authored) recipes, keyed by id -----------------------------------

export function loadCustomRecipes(): Record<string, Recipe> {
  return read(KEYS.customRecipes, {});
}

export function saveCustomRecipe(recipe: Recipe): void {
  const all = read<Record<string, Recipe>>(KEYS.customRecipes, {});
  all[recipe.id] = recipe;
  write(KEYS.customRecipes, all);
}

// Leftovers ----------------------------------------------------------------------
// Entries older than LEFTOVER_PRUNE_MS are dropped on write to bound storage
// growth; the 3-day "available to use" expiry is applied by the caller (see
// lib/hooks/use-leftovers.ts) so already-consumed history isn't lost early.

const LEFTOVER_PRUNE_MS = 30 * 24 * 60 * 60 * 1000;

export function loadLeftovers(): LeftoverEntry[] {
  return read<LeftoverEntry[]>(KEYS.leftovers, []);
}

export function saveLeftover(entry: LeftoverEntry): void {
  const all = read<LeftoverEntry[]>(KEYS.leftovers, []);
  const now = Date.now();
  const pruned = all.filter((e) => now - e.createdAt <= LEFTOVER_PRUNE_MS);
  write(KEYS.leftovers, [...pruned, entry]);
}

export function consumeLeftover(id: string, consumedInto: { date: string; mealType: MealType }): void {
  const all = read<LeftoverEntry[]>(KEYS.leftovers, []);
  const next = all.map((e) => (e.id === id ? { ...e, consumed: true, consumedInto } : e));
  write(KEYS.leftovers, next);
}
