"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getPlanRange, getRecipes } from "@/lib/data";
import { loadCheckedItems, loadCompletedMeals, loadExtraMeals, saveCheckedItems } from "@/lib/data/local-store";
import { todayKey } from "@/lib/dates";
import { buildGroceryList } from "@/lib/grocery";
import { useData } from "@/lib/hooks/use-data";
import { useDietaryStyle } from "@/lib/hooks/use-dietary-style";
import { useFoodPreferences } from "@/lib/hooks/use-food-preferences";
import { useShoppingPreferences } from "@/lib/hooks/use-shopping-preferences";
import type { PlannedMeal } from "@/lib/types";

/** Shopping horizon: this week, starting today. Matches the "weekly grocery budget" framing. */
export const GROCERY_HORIZON_DAYS = 7;

/**
 * The single source of truth for "what's on this week's grocery list" —
 * shared by the Grocery screen (full checklist + cost breakdown) and Today's
 * grocery reminder banner (just the remaining-item count), so both always
 * agree on what's left to buy.
 */
export function useGroceryList() {
  const { dietaryStyle } = useDietaryStyle();
  const { avoidTerms, ranking, servings } = useFoodPreferences();
  const shopping = useShoppingPreferences();

  const recipes = useData(getRecipes);
  const [startKey] = useState(todayKey);
  const loadRange = useCallback(
    () => getPlanRange(startKey, GROCERY_HORIZON_DAYS, dietaryStyle, { avoidTerms, ranking }),
    [startKey, dietaryStyle, avoidTerms, ranking],
  );
  const planRange = useData(loadRange);

  const [extras, setExtras] = useState<PlannedMeal[]>([]);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  // Pulls extras/completed fresh from localStorage. Other screens (Today,
  // Plan) mutate that storage directly when a meal is marked eaten or
  // quick-added — call this after such an action so this hook's own copy
  // (and anything computed from it, like the remaining-items count) doesn't
  // go stale until an unrelated re-render happens to pick it up.
  const refresh = useCallback(() => {
    if (!planRange) return;
    setExtras(planRange.flatMap((day) => loadExtraMeals(day.date)));
    setCompleted(loadCompletedMeals());
    setChecked(loadCheckedItems());
  }, [planRange]);

  // localStorage is client-only; hydrate after the plan range loads so the
  // date keys needed to look up extras are known.
  useEffect(refresh, [refresh]);

  const recipesById = useMemo(() => new Map((recipes ?? []).map((r) => [r.id, r])), [recipes]);

  const groceryList = useMemo(() => {
    if (!planRange || !recipes) return null;
    const meals = [...planRange.flatMap((day) => day.meals), ...extras];
    const completedMealIds = new Set(Object.keys(completed).filter((id) => completed[id]));
    return buildGroceryList({
      meals,
      recipesById,
      completedMealIds,
      householdSize: servings,
      pantryOverrides: shopping.pantryOverrides,
      horizonDays: GROCERY_HORIZON_DAYS,
    });
  }, [planRange, recipes, extras, completed, recipesById, servings, shopping.pantryOverrides]);

  const toggleChecked = (key: string) => {
    setChecked((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      saveCheckedItems(next);
      return next;
    });
  };

  const clearChecked = () => {
    setChecked({});
    saveCheckedItems({});
  };

  return {
    groceryList,
    loading: !groceryList,
    checked,
    toggleChecked,
    clearChecked,
    refresh,
    dietaryStyle,
    ...shopping,
  };
}
