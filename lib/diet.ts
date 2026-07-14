import type { BudgetLevel, DietaryStyle, Recipe } from "@/lib/types";

/** Whether a recipe satisfies the given eating style. */
export function isRecipeDietCompatible(recipe: Recipe, style: DietaryStyle): boolean {
  return recipe.dietaryStyles.includes(style);
}

export function filterRecipesByDiet(recipes: Recipe[], style: DietaryStyle): Recipe[] {
  return recipes.filter((r) => isRecipeDietCompatible(r, style));
}

/**
 * Best-effort, case-insensitive check for whether any of `terms` (allergies,
 * excluded ingredients) appear as a substring of one of the recipe's
 * ingredient names. Not an exhaustive allergen database — a practical first
 * line of defense until Supabase-backed structured ingredient data exists.
 */
export function recipeContainsAnyIngredient(recipe: Recipe, terms: string[]): string | null {
  const names = recipe.ingredients.map((i) => i.name.toLowerCase());
  for (const raw of terms) {
    const term = raw.trim().toLowerCase();
    if (!term) continue;
    const match = names.find((n) => n.includes(term));
    if (match) return raw;
  }
  return null;
}

/** Whether a recipe's cuisine matches any of the user's preferred cuisines (case-insensitive, either direction substring). */
export function recipeMatchesCuisine(recipe: Recipe, cuisines: string[]): boolean {
  const cuisine = recipe.cuisine.toLowerCase();
  return cuisines.some((raw) => {
    const term = raw.trim().toLowerCase();
    return term.length > 0 && (cuisine.includes(term) || term.includes(cuisine));
  });
}

/** Whether a recipe fits within a cook-time budget. `null` means no cap, so everything fits. */
export function recipeWithinCookTime(recipe: Recipe, maxMinutes: number | null): boolean {
  return maxMinutes == null || recipe.prepMinutes + recipe.cookMinutes <= maxMinutes;
}

export interface RankingPreferences {
  /** Ingredient-name substrings to boost, e.g. favorite ingredients. */
  boostIngredients?: string[];
  preferredCuisines?: string[];
  maxCookMinutes?: number | null;
  budgetPreference?: BudgetLevel | null;
}

/**
 * Soft-preference score for ranking recipes — every term here only ever adds
 * weight, never excludes a recipe. Use `recipeContainsAnyIngredient` (allergies,
 * excluded ingredients) separately as a hard filter before ranking by this.
 */
export function scoreRecipe(recipe: Recipe, prefs: RankingPreferences): number {
  let score = 0;
  if (prefs.boostIngredients?.length && recipeContainsAnyIngredient(recipe, prefs.boostIngredients)) {
    score += 2;
  }
  if (prefs.preferredCuisines?.length && recipeMatchesCuisine(recipe, prefs.preferredCuisines)) {
    score += 2;
  }
  if (prefs.maxCookMinutes != null && recipeWithinCookTime(recipe, prefs.maxCookMinutes)) {
    score += 1;
  }
  if (prefs.budgetPreference != null && recipe.costLevel === prefs.budgetPreference) {
    score += 1;
  }
  return score;
}

/** Finds a diet-compatible recipe covering at least one shared meal slot, for swap suggestions. */
export function findDietCompatibleReplacement(
  recipe: Recipe,
  allRecipes: Recipe[],
  style: DietaryStyle,
): Recipe | null {
  const candidates = allRecipes.filter(
    (r) =>
      r.id !== recipe.id &&
      isRecipeDietCompatible(r, style) &&
      r.mealTypes.some((mealType) => recipe.mealTypes.includes(mealType)),
  );
  return candidates[0] ?? null;
}
