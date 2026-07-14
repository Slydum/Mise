import type { DietaryStyle, Recipe, RecipeTag } from "@/lib/types";

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

/**
 * Derives the eating styles a recipe satisfies from its diet-identity tags,
 * mirroring the convention documented on DietaryStyle: a vegan recipe also
 * satisfies vegetarian/pescatarian/omnivore, and so on down the chain. Used
 * when a user creates their own recipe, where dietaryStyles isn't asked for
 * directly — it's inferred from the tags they do pick.
 */
export function deriveDietaryStyles(tags: RecipeTag[]): DietaryStyle[] {
  if (tags.includes("vegan")) return ["vegan", "vegetarian", "pescatarian", "omnivore"];
  if (tags.includes("vegetarian")) return ["vegetarian", "pescatarian", "omnivore"];
  if (tags.includes("pescatarian")) return ["pescatarian", "omnivore"];
  return ["omnivore"];
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
