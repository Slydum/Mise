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

/** Canonical measurement unit an ingredient amount is expressed in, for merging/conversion across recipes. */
export type Unit = "g" | "ml" | "pc";

export interface Ingredient {
  id: string;
  name: string;
  /** Human-readable quantity as written in the recipe (e.g. "2 cloves", "¼ head") — shown as-is on the recipe detail page. */
  quantity: string;
  category: GroceryCategory;
  /** Numeric quantity in `unit`, for shopping-list aggregation. Converted from `quantity` at authoring time (e.g. "2 cloves" -> 0.2 pc of a garlic bulb, "1 tbsp" -> 15 ml). */
  amount: number;
  unit: Unit;
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
  | "high-protein"
  | "quick"
  | "gluten-free"
  | "comfort";

export const RECIPE_TAG_LABELS: Record<RecipeTag, string> = {
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  "high-protein": "High protein",
  quick: "Under 20 min",
  "gluten-free": "Gluten-free",
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

/** Relative cost of a recipe's ingredients, for budget-conscious ranking. */
export type BudgetLevel = "budget" | "moderate" | "splurge";

export const BUDGET_LEVELS: BudgetLevel[] = ["budget", "moderate", "splurge"];

export const BUDGET_LEVEL_LABELS: Record<BudgetLevel, string> = {
  budget: "Budget",
  moderate: "Moderate",
  splurge: "Splurge",
};

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
  /** Freeform cuisine label (e.g. "Japanese", "Mediterranean"), matched case-insensitively against preferred cuisines. */
  cuisine: string;
  /** Relative cost of the recipe's ingredients. */
  costLevel: BudgetLevel;
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
}

export interface DayPlan {
  date: string;
  meals: PlannedMeal[];
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
  /** Default weekly grocery budget in PHP; the user's actual value lives in local-store and can override this. */
  weeklyGroceryBudgetPhp: number;
  /** Default preferred SM Markets branch; the user's actual choice lives in local-store and can override this. */
  preferredSmBranch: string;
}
