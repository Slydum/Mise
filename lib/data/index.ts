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
import { isRecipeDietCompatible, recipeContainsAnyIngredient } from "@/lib/diet";
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

/** Deterministic diet-compatible stand-in when the rotation's usual pick doesn't fit. */
function pickCompatibleFallback(mealType: MealType, style: DietaryStyle, dayOfWeek: number): Recipe {
  const candidates = mockRecipes.filter(
    (r) => r.mealTypes.includes(mealType) && isRecipeDietCompatible(r, style),
  );
  if (candidates.length > 0) return candidates[dayOfWeek % candidates.length];
  // No compatible recipe exists for this slot (shouldn't happen with the current
  // catalog) — fall back to any recipe for the slot rather than crash.
  return mockRecipes.find((r) => r.mealTypes.includes(mealType))!;
}

function plannedMealsFor(dateKey: string, dietaryStyle: DietaryStyle): PlannedMeal[] {
  const dayOfWeek = fromDateKey(dateKey).getDay();
  return MEAL_TYPES.map((mealType: MealType) => {
    const rotation = weeklyRotation[mealType];
    const rotationId = rotation[dayOfWeek % rotation.length];
    const rotationPick = mockRecipes.find((r) => r.id === rotationId)!;
    const recipe = isRecipeDietCompatible(rotationPick, dietaryStyle)
      ? rotationPick
      : pickCompatibleFallback(mealType, dietaryStyle, dayOfWeek);
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
): Promise<DayPlan> {
  return { date: dateKey, meals: plannedMealsFor(dateKey, dietaryStyle) };
}

/** Returns `count` consecutive day plans starting at `startKey`. */
export async function getPlanRange(
  startKey: string,
  count: number,
  dietaryStyle: DietaryStyle = DEFAULT_DIETARY_STYLE,
): Promise<DayPlan[]> {
  const start = fromDateKey(startKey);
  return Promise.all(
    Array.from({ length: count }, (_, i) => getDayPlan(toDateKey(addDays(start, i)), dietaryStyle)),
  );
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
  boostTerms: string[] = [],
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

  const prioritized =
    boostTerms.length > 0
      ? [...rotated].sort(
          (a, b) =>
            Number(Boolean(recipeContainsAnyIngredient(b, boostTerms))) -
            Number(Boolean(recipeContainsAnyIngredient(a, boostTerms))),
        )
      : rotated;

  return prioritized.slice(0, count);
}
