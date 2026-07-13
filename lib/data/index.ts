import type {
  DayPlan,
  GroceryItem,
  MealType,
  PlannedMeal,
  Recipe,
  UserProfile,
} from "@/lib/types";
import { MEAL_TYPES } from "@/lib/types";
import { addDays, fromDateKey, toDateKey } from "@/lib/dates";
import {
  mockGroceryItems,
  mockProfile,
  mockRecipes,
  weeklyRotation,
} from "./mock-data";

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

function plannedMealsFor(dateKey: string): PlannedMeal[] {
  const dayOfWeek = fromDateKey(dateKey).getDay();
  return MEAL_TYPES.map((mealType: MealType) => {
    const rotation = weeklyRotation[mealType];
    const recipeId = rotation[dayOfWeek % rotation.length];
    return {
      id: `${dateKey}-${mealType}`,
      date: dateKey,
      mealType,
      recipeId,
    };
  });
}

export async function getDayPlan(dateKey: string): Promise<DayPlan> {
  return { date: dateKey, meals: plannedMealsFor(dateKey) };
}

/** Returns `count` consecutive day plans starting at `startKey`. */
export async function getPlanRange(startKey: string, count: number): Promise<DayPlan[]> {
  const start = fromDateKey(startKey);
  return Promise.all(
    Array.from({ length: count }, (_, i) => getDayPlan(toDateKey(addDays(start, i)))),
  );
}

export async function getGroceryList(): Promise<GroceryItem[]> {
  return mockGroceryItems;
}

export async function getProfile(): Promise<UserProfile> {
  return mockProfile;
}
