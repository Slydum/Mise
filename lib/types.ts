/** Core domain types for Mise. Shared by the mock data layer today and Supabase later. */

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snacks",
};

export const MEAL_TYPE_EMOJI: Record<MealType, string> = {
  breakfast: "🍳",
  lunch: "🥗",
  dinner: "🍝",
  snack: "🍪",
};

export interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export type GroceryCategory =
  | "produce"
  | "protein"
  | "dairy"
  | "grains"
  | "pantry"
  | "frozen"
  | "other";

export const GROCERY_CATEGORY_LABELS: Record<GroceryCategory, string> = {
  produce: "Produce",
  protein: "Meat & Fish",
  dairy: "Dairy & Eggs",
  grains: "Bread & Grains",
  pantry: "Pantry",
  frozen: "Frozen",
  other: "Other",
};

export const GROCERY_CATEGORY_ORDER: GroceryCategory[] = [
  "produce",
  "protein",
  "dairy",
  "grains",
  "pantry",
  "frozen",
  "other",
];

export interface Ingredient {
  id: string;
  name: string;
  /** Scalable quantity — multiply by a servings ratio and format with lib/ingredients.ts. */
  amount: number;
  /** Singular unit, e.g. "g", "clove", "" for a bare count. Pluralized at display time. */
  unit: string;
  category: GroceryCategory;
}

export interface RecipeStep {
  id: string;
  instruction: string;
  /** Optional active time for the step, shown as a timer chip in cooking mode. */
  durationMinutes?: number;
}

export type RecipeTag =
  | "vegetarian"
  | "vegan"
  | "pescatarian"
  | "high-protein"
  | "quick"
  | "gluten-free"
  | "dairy-free"
  | "contains-eggs"
  | "comfort";

export const RECIPE_TAG_LABELS: Record<RecipeTag, string> = {
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  pescatarian: "Pescatarian",
  "high-protein": "High protein",
  quick: "Under 20 min",
  "gluten-free": "Gluten-free",
  "dairy-free": "Dairy-free",
  "contains-eggs": "Contains eggs",
  comfort: "Comfort",
};

/**
 * Eating styles a recipe can satisfy. Not mutually exclusive: a vegan recipe
 * also satisfies vegetarian, pescatarian, and omnivore, so it lists all four.
 * A chicken recipe satisfies only omnivore; a fish recipe satisfies
 * pescatarian and omnivore but not vegetarian/vegan.
 */
export type DietaryStyle = "omnivore" | "pescatarian" | "vegetarian" | "vegan";

export const DIETARY_STYLES: DietaryStyle[] = ["omnivore", "pescatarian", "vegetarian", "vegan"];

export const DIETARY_STYLE_LABELS: Record<DietaryStyle, string> = {
  omnivore: "Omnivore",
  pescatarian: "Pescatarian",
  vegetarian: "Vegetarian",
  vegan: "Vegan",
};

export const DIETARY_STYLE_DESCRIPTIONS: Record<DietaryStyle, string> = {
  omnivore: "Eats everything, including meat and fish",
  pescatarian: "Fish and seafood, no other meat",
  vegetarian: "No meat or fish; dairy and eggs OK",
  vegan: "No animal products at all",
};

export const DEFAULT_DIETARY_STYLE: DietaryStyle = "pescatarian";

export interface Recipe {
  id: string;
  title: string;
  description: string;
  /** Emoji used as offline-friendly artwork when imageUrl is absent, and as a small identity mark elsewhere. */
  emoji: string;
  /** Optional hero photo. Falls back to generated cover art (see components/food-cover.tsx) until real photography is supplied. */
  imageUrl?: string;
  mealTypes: MealType[];
  tags: RecipeTag[];
  /** Eating styles this recipe satisfies (see DietaryStyle). */
  dietaryStyles: DietaryStyle[];
  prepMinutes: number;
  cookMinutes: number;
  servings: number;
  nutrition: Nutrition;
  ingredients: Ingredient[];
  steps: RecipeStep[];
}

export interface PlannedMeal {
  id: string;
  /** Local date key, YYYY-MM-DD. */
  date: string;
  mealType: MealType;
  recipeId: string;
  /** True when this slot was filled from a saved leftover rather than picked fresh. */
  isLeftover?: boolean;
  /** Links back to the LeftoverEntry that was consumed to fill this slot. */
  sourceLeftoverId?: string;
}

export interface DayPlan {
  date: string;
  meals: PlannedMeal[];
}

/** A saved portion from a completed meal, offered later via "Use leftovers". */
export interface LeftoverEntry {
  id: string;
  recipeId: string;
  sourceDate: string;
  sourceMealType: MealType;
  createdAt: number;
  consumed: boolean;
  consumedInto?: { date: string; mealType: MealType };
}

/** Prefix marking a synthetic Recipe created via "Add custom meal" — never has a prerendered detail/cook page. */
export const CUSTOM_RECIPE_ID_PREFIX = "custom-";

/**
 * True once a custom recipe has real ingredients or steps, i.e. it was made
 * via the recipe-creation form rather than a name-only "Add custom meal"
 * quick-add. Catalog recipes always have content. Used to decide whether a
 * custom recipe gets its own detail/cook page or just opens the action sheet.
 */
export function hasRecipeContent(recipe: Recipe): boolean {
  return recipe.ingredients.length > 0 || recipe.steps.length > 0;
}

/** Where an estimated SM price came from, in fallback-priority order (see lib/grocery/price-overrides.ts). */
export type PriceSource = "manual-sm" | "receipt" | "sm-online";

export interface GroceryItem {
  id: string;
  name: string;
  /** Purchase quantity — what you'd actually buy (e.g. "2 cans", "1 kg"). */
  amount: number;
  unit: string;
  category: GroceryCategory;
  /** Eating styles this item is compatible with. Omitted means diet-agnostic (produce, pantry, etc). */
  dietaryStyles?: DietaryStyle[];
  /** Canonical ingredient identity (see lib/grocery/ingredient-catalog.ts), used for pantry matching. Absent on older stored items — callers fall back to deriving it from `name`. */
  canonicalKey?: string;
  /** Raw quantity the planned recipes need, before rounding up to whole packages. */
  usageAmount?: number;
  usageUnit?: string;
  /** Number of retail packages to buy. */
  packageCount?: number;
  packageLabel?: string;
  packageAmount?: number;
  packageUnit?: string;
  /** Estimated PHP price for one package. */
  estimatedPackagePricePhp?: number;
  /** packageCount * estimatedPackagePricePhp — the checkout cost, not just the usage-proportional value. */
  estimatedTotalPricePhp?: number;
  priceSource?: PriceSource;
  /** Preferred SM branch this price was sourced from, when known. */
  branch?: string;
  /** ISO date the price was last updated. */
  priceUpdatedAt?: string;
}

/** An ingredient the user already has on hand that's nearing its use-by point. */
export interface UseSoonItem {
  id: string;
  name: string;
  emoji: string;
  daysLeft: number;
}

export interface UserProfile {
  name: string;
  goals: Nutrition;
  /** Daily hydration goal, in milliliters. */
  waterGoalMl: number;
  /** Default eating style; the user's actual current choice lives in local-store and can override this. */
  dietaryStyle: DietaryStyle;
}

export type PricingMode = "normal" | "conservative";

/** Shopping preferences, kept local-first like dietary style and food preferences (see lib/data/local-store.ts). */
export interface ShoppingSettings {
  preferredSupermarket: string;
  preferredBranch: string;
  weeklyBudgetPhp: number;
  pricingMode: PricingMode;
  /** People the grocery list should be scaled to feed — drives servingsRatio in lib/data/grocery-generator.ts. */
  householdSize: number;
}

export const DEFAULT_SHOPPING_SETTINGS: ShoppingSettings = {
  preferredSupermarket: "SM Markets",
  preferredBranch: "",
  weeklyBudgetPhp: 3000,
  pricingMode: "normal",
  householdSize: 2,
};
