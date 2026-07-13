"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ContinueCooking } from "@/components/today/continue-cooking";
import { GroceryReminder } from "@/components/today/grocery-reminder";
import { ProgressRings } from "@/components/today/progress-rings";
import { TodayMenu, type TodayMenuEntry } from "@/components/today/today-menu";
import { UseSoonStrip } from "@/components/today/use-soon-strip";
import { DiscoveryRail } from "@/components/discovery-rail";
import { QuickAddSheet } from "@/components/quick-add-sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getDayPlan,
  getGroceryList,
  getProfile,
  getRecipes,
  getSuggestedRecipes,
  getUseSoonIngredients,
} from "@/lib/data";
import {
  addExtraMeal,
  addWaterMl,
  loadActiveCook,
  loadCheckedItems,
  loadCompletedMeals,
  loadExtraMeals,
  loadWaterMl,
  saveCompletedMeals,
  type ActiveCook,
} from "@/lib/data/local-store";
import { greeting, todayKey } from "@/lib/dates";
import { useData } from "@/lib/hooks/use-data";
import { useDietaryStyle } from "@/lib/hooks/use-dietary-style";
import { useFoodPreferences } from "@/lib/hooks/use-food-preferences";
import type { MealType, Nutrition, PlannedMeal, Recipe, UseSoonItem } from "@/lib/types";

const EMPTY_NUTRITION: Nutrition = { calories: 0, protein: 0, carbs: 0, fat: 0 };
const WATER_GLASS_ML = 250;

export function TodayScreen() {
  // Date is resolved on the client so the statically cached page never
  // shows a stale day.
  const [dateKey] = useState(todayKey);
  const { dietaryStyle } = useDietaryStyle();
  const { allergies, excludedIngredients, favoriteIngredients } = useFoodPreferences();

  const recipes = useData(getRecipes);
  const profile = useData(getProfile);
  const groceryList = useData(getGroceryList);
  const loadPlan = useCallback(() => getDayPlan(dateKey, dietaryStyle), [dateKey, dietaryStyle]);
  const plan = useData(loadPlan);
  const loadUseSoon = useCallback(() => getUseSoonIngredients(), []);
  const useSoon = useData(loadUseSoon);

  const [extras, setExtras] = useState<PlannedMeal[]>([]);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [checkedGrocery, setCheckedGrocery] = useState<Record<string, boolean>>({});
  const [waterMl, setWaterMl] = useState(0);
  const [activeCook, setActiveCook] = useState<ActiveCook | null>(null);
  const [quickAdd, setQuickAdd] = useState<{ open: boolean; mealType?: MealType }>({
    open: false,
  });

  // localStorage is client-only; hydrate persisted state after mount so the
  // server-rendered HTML always matches the first client render.
  useEffect(() => {
    setExtras(loadExtraMeals(dateKey));
    setCompleted(loadCompletedMeals());
    setCheckedGrocery(loadCheckedItems());
    setWaterMl(loadWaterMl(dateKey));
    setActiveCook(loadActiveCook());
  }, [dateKey]);

  const recipeById = useMemo(
    () => new Map((recipes ?? []).map((r) => [r.id, r])),
    [recipes],
  );

  const allMeals = useMemo(() => [...(plan?.meals ?? []), ...extras], [plan, extras]);

  const menuEntries = useMemo<TodayMenuEntry[]>(
    () =>
      allMeals.flatMap((meal) => {
        const recipe = recipeById.get(meal.recipeId);
        if (!recipe) return [];
        return [{ id: meal.id, mealType: meal.mealType, recipe, completed: Boolean(completed[meal.id]) }];
      }),
    [allMeals, recipeById, completed],
  );

  const plannedRecipeIds = useMemo(
    () => Array.from(new Set(allMeals.map((m) => m.recipeId))),
    [allMeals],
  );
  const avoidTerms = useMemo(
    () => [...allergies, ...excludedIngredients],
    [allergies, excludedIngredients],
  );
  const loadSuggested = useCallback(
    () =>
      getSuggestedRecipes(
        plannedRecipeIds,
        dateKey,
        6,
        dietaryStyle,
        avoidTerms,
        favoriteIngredients,
      ),
    [plannedRecipeIds, dateKey, dietaryStyle, avoidTerms, favoriteIngredients],
  );
  const suggested = useData(loadSuggested);

  const consumed = useMemo<Nutrition>(() => {
    return allMeals.reduce((total, meal) => {
      if (!completed[meal.id]) return total;
      const recipe = recipeById.get(meal.recipeId);
      if (!recipe) return total;
      return {
        calories: total.calories + recipe.nutrition.calories,
        protein: total.protein + recipe.nutrition.protein,
        carbs: total.carbs + recipe.nutrition.carbs,
        fat: total.fat + recipe.nutrition.fat,
      };
    }, EMPTY_NUTRITION);
  }, [allMeals, completed, recipeById]);

  const toggleCompleted = (mealId: string) => {
    setCompleted((prev) => {
      const next = { ...prev, [mealId]: !prev[mealId] };
      saveCompletedMeals(next);
      return next;
    });
  };

  const handleQuickAdd = (mealType: MealType, recipe: Recipe) => {
    const meal = addExtraMeal(dateKey, mealType, recipe.id);
    setExtras((prev) => [...prev, meal]);
  };

  const handleAddWater = () => {
    setWaterMl(addWaterMl(dateKey, WATER_GLASS_ML));
  };

  const groceryRemaining = (groceryList ?? []).filter((item) => !checkedGrocery[item.id]).length;
  const activeCookRecipe = activeCook ? recipeById.get(activeCook.recipeId) : undefined;

  const loading = !plan || !recipes || !profile;

  return (
    <div className="flex flex-col gap-6 pb-6 pt-3 animate-fade-up">
      <header className="px-5">
        {/* Date and greeting are computed at render time, so the statically
            prerendered HTML can differ from the client — suppress the
            one-off text patch. */}
        <p suppressHydrationWarning className="text-sm font-medium text-muted-foreground">
          {greeting()} 🌿
        </p>
        <h1 suppressHydrationWarning className="font-serif text-4xl font-medium tracking-tight">
          {profile ? profile.name : ""}
        </h1>
      </header>

      {loading ? (
        <TodaySkeleton />
      ) : (
        <>
          <TodayMenu
            entries={menuEntries}
            onToggle={toggleCompleted}
            onAddSlot={(mealType) => setQuickAdd({ open: true, mealType })}
            onQuickAdd={() => setQuickAdd({ open: true })}
          />

          <ProgressRings
            calories={consumed.calories}
            caloriesGoal={profile.goals.calories}
            protein={consumed.protein}
            proteinGoal={profile.goals.protein}
            waterMl={waterMl}
            waterGoalMl={profile.waterGoalMl}
            onAddWater={handleAddWater}
          />

          {activeCookRecipe ? (
            <ContinueCooking recipe={activeCookRecipe} stepIndex={activeCook!.stepIndex} />
          ) : null}

          <GroceryReminder remaining={groceryRemaining} />

          <UseSoonStrip items={useSoon ?? ([] as UseSoonItem[])} />

          <DiscoveryRail title="Suggested for You" recipes={suggested ?? []} />
        </>
      )}

      <QuickAddSheet
        open={quickAdd.open}
        onOpenChange={(open) => setQuickAdd((prev) => ({ ...prev, open }))}
        initialMealType={quickAdd.mealType}
        onAdd={handleQuickAdd}
      />
    </div>
  );
}

function TodaySkeleton() {
  return (
    <div className="flex flex-col gap-6 px-5" aria-hidden>
      <Skeleton className="h-64 rounded-3xl" />
      <div className="flex justify-center gap-6">
        <Skeleton className="size-[100px] rounded-full" />
        <Skeleton className="size-[100px] rounded-full" />
        <Skeleton className="size-[100px] rounded-full" />
      </div>
      <Skeleton className="h-24 rounded-3xl" />
    </div>
  );
}
