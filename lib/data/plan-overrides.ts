import { getDayPlan, getRecipes, getSuggestedRecipes } from "@/lib/data";
import {
  addExtraMeal,
  bumpRegenSeed,
  clearExtraMeals,
  consumeLeftover,
  loadCompletedMeals,
  loadCustomRecipes,
  loadExtraMeals,
  loadSlotOverrides,
  removeExtraMeal,
  saveCompletedMeals,
  saveCustomRecipe,
  saveLeftover,
  saveSlotOverride,
} from "@/lib/data/local-store";
import { addDays, fromDateKey, toDateKey } from "@/lib/dates";
import type { DietaryStyle, LeftoverEntry, MealType, PlannedMeal, Recipe } from "@/lib/types";
import { CUSTOM_RECIPE_ID_PREFIX, DIETARY_STYLES, MEAL_TYPES } from "@/lib/types";

/**
 * Framework-free plan resolution and mutation logic. `getDayPlan` stays a
 * pure, deterministic function of day-of-week + dietary style (see
 * lib/data/index.ts); everything editable lives in the localStorage override
 * layers this module reads and writes, so the two compose without either
 * side needing to know about the other. Called directly by
 * lib/hooks/use-day-plan.ts and by the copy/move destination picker (which
 * needs to resolve *other* days without mounting a hook per candidate day).
 */

export interface ResolvedMeal {
  id: string;
  date: string;
  mealType: MealType;
  recipeId: string;
  recipe: Recipe;
  completed: boolean;
  isLeftover: boolean;
  sourceLeftoverId?: string;
  /** False for the one deterministic rotation slot per meal type; true for anything stacked on top of it. */
  isExtra: boolean;
}

export async function buildRecipeIndex(): Promise<Map<string, Recipe>> {
  const catalog = await getRecipes();
  const custom = loadCustomRecipes();
  const map = new Map(catalog.map((r) => [r.id, r]));
  for (const recipe of Object.values(custom)) map.set(recipe.id, recipe);
  return map;
}

function clearCompletedFlags(ids: string[]): void {
  if (ids.length === 0) return;
  const completed = loadCompletedMeals();
  const next = { ...completed };
  let changed = false;
  for (const id of ids) {
    if (next[id] !== undefined) {
      delete next[id];
      changed = true;
    }
  }
  if (changed) saveCompletedMeals(next);
}

export async function resolveDayMeals(dateKey: string, dietaryStyle: DietaryStyle): Promise<ResolvedMeal[]> {
  const [basePlan, recipeById] = await Promise.all([
    getDayPlan(dateKey, dietaryStyle),
    buildRecipeIndex(),
  ]);
  const overrides = loadSlotOverrides();
  const extras = loadExtraMeals(dateKey);
  const completed = loadCompletedMeals();

  const toResolved = (meal: PlannedMeal, isExtra: boolean): ResolvedMeal | null => {
    const recipe = recipeById.get(meal.recipeId);
    if (!recipe) return null;
    return {
      id: meal.id,
      date: meal.date,
      mealType: meal.mealType,
      recipeId: recipe.id,
      recipe,
      completed: Boolean(completed[meal.id]),
      isLeftover: Boolean(meal.isLeftover),
      sourceLeftoverId: meal.sourceLeftoverId,
      isExtra,
    };
  };

  const base: ResolvedMeal[] = [];
  for (const meal of basePlan.meals) {
    const override = overrides[meal.id];
    if (override) {
      if (override.recipeId === null) continue; // removed, no replacement
      const recipe = recipeById.get(override.recipeId);
      if (!recipe) continue;
      base.push({
        id: meal.id,
        date: meal.date,
        mealType: meal.mealType,
        recipeId: recipe.id,
        recipe,
        completed: Boolean(completed[meal.id]),
        isLeftover: Boolean(override.isLeftover),
        sourceLeftoverId: override.sourceLeftoverId,
        isExtra: false,
      });
      continue;
    }
    const resolved = toResolved(meal, false);
    if (resolved) base.push(resolved);
  }

  const extraResolved: ResolvedMeal[] = [];
  for (const meal of extras) {
    const resolved = toResolved(meal, true);
    if (resolved) extraResolved.push(resolved);
  }

  return [...base, ...extraResolved].sort((a, b) => {
    const ai = MEAL_TYPES.indexOf(a.mealType);
    const bi = MEAL_TYPES.indexOf(b.mealType);
    if (ai !== bi) return ai - bi;
    return Number(a.isExtra) - Number(b.isExtra);
  });
}

export function replaceMeal(meal: ResolvedMeal, newRecipeId: string): void {
  if (meal.isExtra) {
    removeExtraMeal(meal.date, meal.id);
    addExtraMeal(meal.date, meal.mealType, newRecipeId);
  } else {
    saveSlotOverride(meal.id, { recipeId: newRecipeId });
  }
  clearCompletedFlags([meal.id]);
}

export function removeMeal(meal: ResolvedMeal): void {
  if (meal.isExtra) {
    removeExtraMeal(meal.date, meal.id);
  } else {
    saveSlotOverride(meal.id, { recipeId: null });
  }
  clearCompletedFlags([meal.id]);
}

export function addMeal(
  dateKey: string,
  mealType: MealType,
  recipeId: string,
  opts?: { isLeftover?: boolean; sourceLeftoverId?: string },
): PlannedMeal {
  return addExtraMeal(dateKey, mealType, recipeId, opts);
}

async function placeMealAt(
  recipeId: string,
  toDate: string,
  toMealType: MealType,
  dietaryStyle: DietaryStyle,
  opts?: { replaceExisting?: boolean },
): Promise<void> {
  const destMeals = await resolveDayMeals(toDate, dietaryStyle);
  const occupants = destMeals.filter((m) => m.mealType === toMealType);
  const targetSlotId = `${toDate}-${toMealType}`;

  if (occupants.length === 0) {
    // Every day always resolves exactly one base meal per type, so an empty
    // slot here only happens when it was previously removed — filling it via
    // an override is correct and idempotent.
    saveSlotOverride(targetSlotId, { recipeId });
    return;
  }

  if (opts?.replaceExisting) {
    for (const occupant of occupants) removeMeal(occupant);
    saveSlotOverride(targetSlotId, { recipeId });
    return;
  }

  addExtraMeal(toDate, toMealType, recipeId);
}

export async function copyMealTo(
  meal: ResolvedMeal,
  toDate: string,
  toMealType: MealType,
  dietaryStyle: DietaryStyle,
  opts?: { replaceExisting?: boolean },
): Promise<void> {
  await placeMealAt(meal.recipeId, toDate, toMealType, dietaryStyle, opts);
}

export async function moveMealTo(
  meal: ResolvedMeal,
  toDate: string,
  toMealType: MealType,
  dietaryStyle: DietaryStyle,
  opts?: { replaceExisting?: boolean },
): Promise<void> {
  await placeMealAt(meal.recipeId, toDate, toMealType, dietaryStyle, opts);
  removeMeal(meal);
}

export function clearDay(dateKey: string): void {
  const slotIds = MEAL_TYPES.map((mealType) => `${dateKey}-${mealType}`);
  for (const slotId of slotIds) {
    saveSlotOverride(slotId, { recipeId: null });
  }
  const extraIds = loadExtraMeals(dateKey).map((m) => m.id);
  clearCompletedFlags([...slotIds, ...extraIds]);
  clearExtraMeals(dateKey);
}

export async function regenerateDay(
  dateKey: string,
  dietaryStyle: DietaryStyle,
  avoidTerms: string[] = [],
  boostTerms: string[] = [],
): Promise<void> {
  const seed = bumpRegenSeed(dateKey);
  clearDay(dateKey);
  const chosenIds: string[] = [];
  for (const mealType of MEAL_TYPES) {
    const picks = await getSuggestedRecipes(
      chosenIds,
      `${dateKey}:${mealType}:${seed}`,
      1,
      dietaryStyle,
      avoidTerms,
      boostTerms,
    );
    const pick = picks[0];
    if (!pick) continue; // nothing left that fits; leave the slot empty rather than crash
    chosenIds.push(pick.id);
    saveSlotOverride(`${dateKey}-${mealType}`, { recipeId: pick.id });
  }
}

export async function markLeftover(
  meal: ResolvedMeal,
  dietaryStyle: DietaryStyle,
): Promise<{ placedDirectly: boolean }> {
  const tomorrow = toDateKey(addDays(fromDateKey(meal.date), 1));
  const entryId = `leftover-${meal.recipeId}-${Date.now()}`;

  const tomorrowMeals = await resolveDayMeals(tomorrow, dietaryStyle);
  const lunchOccupied = tomorrowMeals.some((m) => m.mealType === "lunch");

  if (!lunchOccupied) {
    saveSlotOverride(`${tomorrow}-lunch`, {
      recipeId: meal.recipeId,
      isLeftover: true,
      sourceLeftoverId: entryId,
    });
    saveLeftover({
      id: entryId,
      recipeId: meal.recipeId,
      sourceDate: meal.date,
      sourceMealType: meal.mealType,
      createdAt: Date.now(),
      consumed: true,
      consumedInto: { date: tomorrow, mealType: "lunch" },
    });
    return { placedDirectly: true };
  }

  saveLeftover({
    id: entryId,
    recipeId: meal.recipeId,
    sourceDate: meal.date,
    sourceMealType: meal.mealType,
    createdAt: Date.now(),
    consumed: false,
  });
  return { placedDirectly: false };
}

/** Consumes a saved leftover into a specific slot. Not a React hook despite the domain verb. */
export function placeLeftover(entry: LeftoverEntry, toDate: string, toMealType: MealType): PlannedMeal {
  const meal = addExtraMeal(toDate, toMealType, entry.recipeId, {
    isLeftover: true,
    sourceLeftoverId: entry.id,
  });
  consumeLeftover(entry.id, { date: toDate, mealType: toMealType });
  return meal;
}

export function createCustomMealRecipe(name: string): Recipe {
  const recipe: Recipe = {
    id: `${CUSTOM_RECIPE_ID_PREFIX}${Date.now()}`,
    title: name.trim(),
    description: "Custom meal",
    emoji: "🍽️",
    mealTypes: MEAL_TYPES,
    tags: [],
    dietaryStyles: DIETARY_STYLES,
    prepMinutes: 0,
    cookMinutes: 0,
    servings: 1,
    nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    ingredients: [],
    steps: [],
  };
  saveCustomRecipe(recipe);
  return recipe;
}

export function toggleMealCompleted(mealId: string): boolean {
  const completed = loadCompletedMeals();
  const next = { ...completed, [mealId]: !completed[mealId] };
  saveCompletedMeals(next);
  return Boolean(next[mealId]);
}
