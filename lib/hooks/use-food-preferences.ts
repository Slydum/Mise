"use client";

import { useEffect, useMemo, useState } from "react";
import type { RankingPreferences } from "@/lib/diet";
import {
  loadAllergies,
  loadBudgetPreference,
  loadCalorieGoal,
  loadExcludedIngredients,
  loadFavoriteIngredients,
  loadMaxCookMinutes,
  loadPreferredCuisines,
  loadProteinGoal,
  loadServings,
  saveAllergies,
  saveBudgetPreference,
  saveCalorieGoal,
  saveExcludedIngredients,
  saveFavoriteIngredients,
  saveMaxCookMinutes,
  savePreferredCuisines,
  saveProteinGoal,
  saveServings,
} from "@/lib/data/local-store";
import type { BudgetLevel } from "@/lib/types";

function addUnique(list: string[], value: string): string[] {
  const trimmed = value.trim();
  if (!trimmed || list.some((v) => v.toLowerCase() === trimmed.toLowerCase())) return list;
  return [...list, trimmed];
}

/**
 * Client-hydrated food preferences: allergies, excluded/favorite ingredients,
 * preferred cuisines, cooking constraints (max time, budget, servings), and
 * calorie/protein goal overrides. Backed by localStorage (see local-store.ts).
 */
export function useFoodPreferences() {
  const [allergies, setAllergies] = useState<string[]>([]);
  const [excludedIngredients, setExcludedIngredients] = useState<string[]>([]);
  const [favoriteIngredients, setFavoriteIngredients] = useState<string[]>([]);
  const [preferredCuisines, setPreferredCuisines] = useState<string[]>([]);
  const [maxCookMinutes, setMaxCookMinutesState] = useState<number | null>(null);
  const [budgetPreference, setBudgetPreferenceState] = useState<BudgetLevel | null>(null);
  const [servings, setServingsState] = useState<number>(2);
  const [calorieGoal, setCalorieGoalState] = useState<number | null>(null);
  const [proteinGoal, setProteinGoalState] = useState<number | null>(null);

  useEffect(() => {
    setAllergies(loadAllergies());
    setExcludedIngredients(loadExcludedIngredients());
    setFavoriteIngredients(loadFavoriteIngredients());
    setPreferredCuisines(loadPreferredCuisines());
    setMaxCookMinutesState(loadMaxCookMinutes());
    setBudgetPreferenceState(loadBudgetPreference());
    setServingsState(loadServings());
    setCalorieGoalState(loadCalorieGoal());
    setProteinGoalState(loadProteinGoal());
  }, []);

  const addAllergy = (value: string) =>
    setAllergies((prev) => {
      const next = addUnique(prev, value);
      saveAllergies(next);
      return next;
    });
  const removeAllergy = (value: string) =>
    setAllergies((prev) => {
      const next = prev.filter((v) => v !== value);
      saveAllergies(next);
      return next;
    });

  const addExcluded = (value: string) =>
    setExcludedIngredients((prev) => {
      const next = addUnique(prev, value);
      saveExcludedIngredients(next);
      return next;
    });
  const removeExcluded = (value: string) =>
    setExcludedIngredients((prev) => {
      const next = prev.filter((v) => v !== value);
      saveExcludedIngredients(next);
      return next;
    });

  const addFavorite = (value: string) =>
    setFavoriteIngredients((prev) => {
      const next = addUnique(prev, value);
      saveFavoriteIngredients(next);
      return next;
    });
  const removeFavorite = (value: string) =>
    setFavoriteIngredients((prev) => {
      const next = prev.filter((v) => v !== value);
      saveFavoriteIngredients(next);
      return next;
    });

  const addPreferredCuisine = (value: string) =>
    setPreferredCuisines((prev) => {
      const next = addUnique(prev, value);
      savePreferredCuisines(next);
      return next;
    });
  const removePreferredCuisine = (value: string) =>
    setPreferredCuisines((prev) => {
      const next = prev.filter((v) => v !== value);
      savePreferredCuisines(next);
      return next;
    });

  const setMaxCookMinutes = (value: number | null) => {
    setMaxCookMinutesState(value);
    saveMaxCookMinutes(value);
  };

  const setBudgetPreference = (value: BudgetLevel | null) => {
    setBudgetPreferenceState(value);
    saveBudgetPreference(value);
  };

  const setServings = (value: number) => {
    setServingsState(value);
    saveServings(value);
  };

  const setCalorieGoal = (value: number | null) => {
    setCalorieGoalState(value);
    saveCalorieGoal(value);
  };

  const setProteinGoal = (value: number | null) => {
    setProteinGoalState(value);
    saveProteinGoal(value);
  };

  // Ready-made hard-exclusion terms and soft-ranking preferences, shared by
  // every screen that picks or ranks recipes (Today, Plan, Quick Add) so
  // they can't drift out of sync with each other.
  const avoidTerms = useMemo(
    () => [...allergies, ...excludedIngredients],
    [allergies, excludedIngredients],
  );
  const ranking = useMemo<RankingPreferences>(
    () => ({
      boostIngredients: favoriteIngredients,
      preferredCuisines,
      maxCookMinutes,
      budgetPreference,
    }),
    [favoriteIngredients, preferredCuisines, maxCookMinutes, budgetPreference],
  );

  return {
    avoidTerms,
    ranking,
    allergies,
    excludedIngredients,
    favoriteIngredients,
    preferredCuisines,
    maxCookMinutes,
    budgetPreference,
    servings,
    calorieGoal,
    proteinGoal,
    addAllergy,
    removeAllergy,
    addExcluded,
    removeExcluded,
    addFavorite,
    removeFavorite,
    addPreferredCuisine,
    removePreferredCuisine,
    setMaxCookMinutes,
    setBudgetPreference,
    setServings,
    setCalorieGoal,
    setProteinGoal,
  };
}
