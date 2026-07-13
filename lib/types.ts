/** Core domain types for Mise. Shared by the mock data layer today and Supabase later. */

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snacks",
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
  quantity: string;
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

export interface Recipe {
  id: string;
  title: string;
  description: string;
  /** Emoji used as offline-friendly artwork for the recipe. */
  emoji: string;
  mealTypes: MealType[];
  tags: RecipeTag[];
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

export interface GroceryItem {
  id: string;
  name: string;
  quantity: string;
  category: GroceryCategory;
}

export interface UserProfile {
  name: string;
  goals: Nutrition;
}
