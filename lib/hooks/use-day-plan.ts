"use client";

import { useCallback, useEffect, useState } from "react";
import {
  addMeal as addMealOverride,
  clearDay as clearDayOverride,
  copyMealTo as copyMealToOverride,
  markLeftover as markLeftoverOverride,
  moveMealTo as moveMealToOverride,
  regenerateDay as regenerateDayOverride,
  removeMeal as removeMealOverride,
  replaceMeal as replaceMealOverride,
  resolveDayMeals,
  toggleMealCompleted,
  type ResolvedMeal,
} from "@/lib/data/plan-overrides";
import type { DietaryStyle, MealType } from "@/lib/types";

export interface UseDayPlanResult {
  meals: ResolvedMeal[];
  loading: boolean;
  refresh: () => void;
  replaceMeal: (meal: ResolvedMeal, newRecipeId: string) => void;
  removeMeal: (meal: ResolvedMeal) => void;
  addMeal: (
    mealType: MealType,
    recipeId: string,
    opts?: { isLeftover?: boolean; sourceLeftoverId?: string },
  ) => void;
  copyMealTo: (
    meal: ResolvedMeal,
    toDate: string,
    toMealType: MealType,
    opts?: { replaceExisting?: boolean },
  ) => Promise<void>;
  moveMealTo: (
    meal: ResolvedMeal,
    toDate: string,
    toMealType: MealType,
    opts?: { replaceExisting?: boolean },
  ) => Promise<void>;
  toggleCompleted: (mealId: string) => void;
  clearDay: () => void;
  regenerateDay: (avoidTerms?: string[], boostTerms?: string[]) => Promise<void>;
  markLeftover: (meal: ResolvedMeal) => Promise<{ placedDirectly: boolean }>;
}

/**
 * Resolved, editable meal plan for a single date — the shared source of
 * truth Today and Plan both read and mutate through, replacing the
 * near-duplicate merge logic that used to live directly in each screen.
 */
export function useDayPlan(dateKey: string | null, dietaryStyle: DietaryStyle): UseDayPlanResult {
  const [meals, setMeals] = useState<ResolvedMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  const refresh = useCallback(() => setReloadToken((t) => t + 1), []);

  useEffect(() => {
    if (!dateKey) return;
    let active = true;
    setLoading(true);
    resolveDayMeals(dateKey, dietaryStyle).then((resolved) => {
      if (active) {
        setMeals(resolved);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [dateKey, dietaryStyle, reloadToken]);

  const replaceMeal = useCallback(
    (meal: ResolvedMeal, newRecipeId: string) => {
      replaceMealOverride(meal, newRecipeId);
      refresh();
    },
    [refresh],
  );

  const removeMeal = useCallback(
    (meal: ResolvedMeal) => {
      removeMealOverride(meal);
      refresh();
    },
    [refresh],
  );

  const addMeal = useCallback(
    (mealType: MealType, recipeId: string, opts?: { isLeftover?: boolean; sourceLeftoverId?: string }) => {
      if (!dateKey) return;
      addMealOverride(dateKey, mealType, recipeId, opts);
      refresh();
    },
    [dateKey, refresh],
  );

  const copyMealTo = useCallback(
    async (meal: ResolvedMeal, toDate: string, toMealType: MealType, opts?: { replaceExisting?: boolean }) => {
      await copyMealToOverride(meal, toDate, toMealType, dietaryStyle, opts);
      refresh();
    },
    [dietaryStyle, refresh],
  );

  const moveMealTo = useCallback(
    async (meal: ResolvedMeal, toDate: string, toMealType: MealType, opts?: { replaceExisting?: boolean }) => {
      await moveMealToOverride(meal, toDate, toMealType, dietaryStyle, opts);
      refresh();
    },
    [dietaryStyle, refresh],
  );

  const toggleCompleted = useCallback(
    (mealId: string) => {
      toggleMealCompleted(mealId);
      refresh();
    },
    [refresh],
  );

  const clearDay = useCallback(() => {
    if (!dateKey) return;
    clearDayOverride(dateKey);
    refresh();
  }, [dateKey, refresh]);

  const regenerateDay = useCallback(
    async (avoidTerms: string[] = [], boostTerms: string[] = []) => {
      if (!dateKey) return;
      await regenerateDayOverride(dateKey, dietaryStyle, avoidTerms, boostTerms);
      refresh();
    },
    [dateKey, dietaryStyle, refresh],
  );

  const markLeftover = useCallback(
    async (meal: ResolvedMeal) => {
      const result = await markLeftoverOverride(meal, dietaryStyle);
      refresh();
      return result;
    },
    [dietaryStyle, refresh],
  );

  return {
    meals,
    loading,
    refresh,
    replaceMeal,
    removeMeal,
    addMeal,
    copyMealTo,
    moveMealTo,
    toggleCompleted,
    clearDay,
    regenerateDay,
    markLeftover,
  };
}
