import type {
  DayPlan,
  DietaryStyle,
  MealType,
  PlannedMeal,
  Recipe,
  UseSoonItem,
  UserProfile,
} from "@/lib/types";
import { DEFAULT_DIETARY_STYLE, MEAL_TYPES } from "@/lib/types";
import { addDays, fromDateKey, toDateKey } from "@/lib/dates";
import {
  isRecipeDietCompatible,
  recipeContainsAnyIngredient,
  scoreRecipe,
  type RankingPreferences,
} from "@/lib/diet";
import { PRICE_CATALOG, PRICE_CATALOG_META, type PriceCatalogEntry } from "./sm-price-catalog";
import { mockProfile, mockRecipes, mockUseSoon, weeklyRotation } from "./mock-data";

/**
 * Data provider for Mise.
 *
 * Every screen reads through these async functions and nothing else, so the
 * mock implementation below can be swapped for Supabase queries (see
 * `lib/supabase/client.ts`) without touching any component code. Keep the
 * signatures Promise-based for that reason even though the mock resolves
 * instantly.
 */

export async function getRecipes(): Promise<Recipe[]> {
  return mockRecipes;
}

export async function getRecipe(id: string): Promise<Recipe | null> {
  return mockRecipes.find((r) => r.id === id) ?? null;
}

/** Allergies and excluded ingredients are hard rules; everything else is a soft ranking boost. */
export interface PlanPreferences {
  avoidTerms?: string[];
  ranking?: RankingPreferences;
}

/** Ranks candidates by soft preference and picks deterministically by day-of-week. */
function rankAndPick(candidates: Recipe[], dayOfWeek: number, ranking: RankingPreferences): Recipe {
  const ranked = [...candidates].sort((a, b) => scoreRecipe(b, ranking) - scoreRecipe(a, ranking));
  return ranked[dayOfWeek % ranked.length];
}

/**
 * Deterministic stand-in for when the rotation's usual pick doesn't fit —
 * either the eating style or (hard rule) an allergy/excluded ingredient.
 * Ranks the remaining candidates by soft preference (cuisine, cook time,
 * budget, favorite ingredients) and picks among them by day-of-week so the
 * result stays stable across renders.
 *
 * If no recipe for this slot satisfies both hard rules at once (shouldn't
 * happen with the current catalog), allergy/exclusion safety is relaxed last,
 * after eating style — allergies can cause real harm, eating style can't.
 */
function pickCompatibleFallback(
  mealType: MealType,
  style: DietaryStyle,
  dayOfWeek: number,
  avoidTerms: string[],
  ranking: RankingPreferences,
): Recipe {
  const bothRules = mockRecipes.filter(
    (r) =>
      r.mealTypes.includes(mealType) &&
      isRecipeDietCompatible(r, style) &&
      !recipeContainsAnyIngredient(r, avoidTerms),
  );
  if (bothRules.length > 0) return rankAndPick(bothRules, dayOfWeek, ranking);

  const avoidOnly = mockRecipes.filter(
    (r) => r.mealTypes.includes(mealType) && !recipeContainsAnyIngredient(r, avoidTerms),
  );
  if (avoidOnly.length > 0) return rankAndPick(avoidOnly, dayOfWeek, ranking);

  const dietOnly = mockRecipes.filter(
    (r) => r.mealTypes.includes(mealType) && isRecipeDietCompatible(r, style),
  );
  if (dietOnly.length > 0) return rankAndPick(dietOnly, dayOfWeek, ranking);

  return mockRecipes.find((r) => r.mealTypes.includes(mealType))!;
}

function plannedMealsFor(
  dateKey: string,
  dietaryStyle: DietaryStyle,
  prefs: PlanPreferences,
): PlannedMeal[] {
  const dayOfWeek = fromDateKey(dateKey).getDay();
  const avoidTerms = prefs.avoidTerms ?? [];
  const ranking = prefs.ranking ?? {};
  return MEAL_TYPES.map((mealType: MealType) => {
    const rotation = weeklyRotation[mealType];
    const rotationId = rotation[dayOfWeek % rotation.length];
    const rotationPick = mockRecipes.find((r) => r.id === rotationId)!;
    const rotationPickAllowed =
      isRecipeDietCompatible(rotationPick, dietaryStyle) &&
      !recipeContainsAnyIngredient(rotationPick, avoidTerms);
    const recipe = rotationPickAllowed
      ? rotationPick
      : pickCompatibleFallback(mealType, dietaryStyle, dayOfWeek, avoidTerms, ranking);
    return {
      id: `${dateKey}-${mealType}`,
      date: dateKey,
      mealType,
      recipeId: recipe.id,
    };
  });
}

export async function getDayPlan(
  dateKey: string,
  dietaryStyle: DietaryStyle = DEFAULT_DIETARY_STYLE,
  prefs: PlanPreferences = {},
): Promise<DayPlan> {
  return { date: dateKey, meals: plannedMealsFor(dateKey, dietaryStyle, prefs) };
}

/** Returns `count` consecutive day plans starting at `startKey`. */
export async function getPlanRange(
  startKey: string,
  count: number,
  dietaryStyle: DietaryStyle = DEFAULT_DIETARY_STYLE,
  prefs: PlanPreferences = {},
): Promise<DayPlan[]> {
  const start = fromDateKey(startKey);
  return Promise.all(
    Array.from({ length: count }, (_, i) =>
      getDayPlan(toDateKey(addDays(start, i)), dietaryStyle, prefs),
    ),
  );
}

export interface PriceCatalog {
  entries: Record<string, PriceCatalogEntry>;
  source: string;
  lastUpdated: string;
  note: string;
}

/** SM Markets sample price catalog — a small curated basket, not a live feed (see PRICE_CATALOG_META). */
export async function getPriceCatalog(): Promise<PriceCatalog> {
  return { entries: PRICE_CATALOG, ...PRICE_CATALOG_META };
}

export async function getProfile(): Promise<UserProfile> {
  return mockProfile;
}

export async function getUseSoonIngredients(): Promise<UseSoonItem[]> {
  return mockUseSoon;
}

/**
 * A small, deterministic rotation of recipes to surface as inspiration —
 * excludes whatever's already planned, filters to the user's eating style,
 * and skips anything containing an avoided ingredient, so it reads as
 * trustworthy discovery rather than a repeat or a mismatch.
 * `seedKey` (typically today's date key) varies the starting point day to
 * day without relying on randomness, so server and client render the same list.
 */
export async function getSuggestedRecipes(
  excludeIds: string[] = [],
  seedKey = "",
  count = 6,
  dietaryStyle: DietaryStyle = DEFAULT_DIETARY_STYLE,
  avoidTerms: string[] = [],
  ranking: RankingPreferences = {},
): Promise<Recipe[]> {
  let pool = mockRecipes.filter(
    (r) => !excludeIds.includes(r.id) && isRecipeDietCompatible(r, dietaryStyle),
  );
  if (avoidTerms.length > 0) {
    pool = pool.filter((r) => !recipeContainsAnyIngredient(r, avoidTerms));
  }
  if (pool.length === 0) return [];

  let seed = 0;
  for (let i = 0; i < seedKey.length; i++) seed = (seed + seedKey.charCodeAt(i)) % pool.length;
  const rotated = [...pool.slice(seed), ...pool.slice(0, seed)];

  const prioritized = [...rotated].sort((a, b) => scoreRecipe(b, ranking) - scoreRecipe(a, ranking));

  return prioritized.slice(0, count);
}
