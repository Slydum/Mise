"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ContinueCooking } from "@/components/today/continue-cooking";
import { GroceryReminder } from "@/components/today/grocery-reminder";
import { ProgressRings } from "@/components/today/progress-rings";
import { TodayMenu } from "@/components/today/today-menu";
import { UseSoonStrip } from "@/components/today/use-soon-strip";
import { DiscoveryRail } from "@/components/discovery-rail";
import { Skeleton } from "@/components/ui/skeleton";
import { getProfile, getRecipes, getSuggestedRecipes, getUseSoonIngredients } from "@/lib/data";
import { addWaterMl, loadActiveCook, loadWaterMl, type ActiveCook } from "@/lib/data/local-store";
import { greeting, todayKey } from "@/lib/dates";
import { useData } from "@/lib/hooks/use-data";
import { useDayPlan } from "@/lib/hooks/use-day-plan";
import { useDietaryStyle } from "@/lib/hooks/use-dietary-style";
import { useFoodPreferences } from "@/lib/hooks/use-food-preferences";
import { useGroceryList } from "@/lib/hooks/use-grocery-list";
import { usePlanSheets } from "@/lib/hooks/use-plan-sheets";
import { useShoppingSettings } from "@/lib/hooks/use-shopping-settings";
import type { Nutrition, UseSoonItem } from "@/lib/types";

const EMPTY_NUTRITION: Nutrition = { calories: 0, protein: 0, carbs: 0, fat: 0 };
const WATER_GLASS_ML = 250;

export function TodayScreen() {
  // Date is resolved on the client so the statically cached page never
  // shows a stale day.
  const [dateKey] = useState(todayKey);
  const { dietaryStyle } = useDietaryStyle();
  const { allergies, excludedIngredients, favoriteIngredients } = useFoodPreferences();
  const { settings: shoppingSettings } = useShoppingSettings();

  const recipes = useData(getRecipes);
  const profile = useData(getProfile);
  const grocery = useGroceryList(dietaryStyle, shoppingSettings.householdSize, shoppingSettings.store?.storeId ?? null);
  const loadUseSoon = useCallback(() => getUseSoonIngredients(), []);
  const useSoon = useData(loadUseSoon);

  const dayPlan = useDayPlan(dateKey, dietaryStyle);

  const [waterMl, setWaterMl] = useState(0);
  const [activeCook, setActiveCook] = useState<ActiveCook | null>(null);

  // localStorage is client-only; hydrate persisted state after mount so the
  // server-rendered HTML always matches the first client render.
  useEffect(() => {
    setWaterMl(loadWaterMl(dateKey));
    setActiveCook(loadActiveCook());
  }, [dateKey]);

  const recipeById = useMemo(() => new Map((recipes ?? []).map((r) => [r.id, r])), [recipes]);

  const avoidTerms = useMemo(
    () => [...allergies, ...excludedIngredients],
    [allergies, excludedIngredients],
  );

  const plannedRecipeIds = useMemo(
    () => Array.from(new Set(dayPlan.meals.map((m) => m.recipeId))),
    [dayPlan.meals],
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
    return dayPlan.meals.reduce((total, meal) => {
      if (!meal.completed) return total;
      return {
        calories: total.calories + meal.recipe.nutrition.calories,
        protein: total.protein + meal.recipe.nutrition.protein,
        carbs: total.carbs + meal.recipe.nutrition.carbs,
        fat: total.fat + meal.recipe.nutrition.fat,
      };
    }, EMPTY_NUTRITION);
  }, [dayPlan.meals]);

  const handleAddWater = () => {
    setWaterMl(addWaterMl(dateKey, WATER_GLASS_ML));
  };

  const planSheets = usePlanSheets({
    dateKey,
    dayPlan,
    dietaryStyle,
    avoidTerms,
    boostTerms: favoriteIngredients,
  });

  const groceryRemaining = grocery.items.filter((item) => !grocery.checked[item.id]).length;
  const activeCookRecipe = activeCook ? recipeById.get(activeCook.recipeId) : undefined;

  const loading = dayPlan.loading || !recipes || !profile;

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
            entries={dayPlan.meals}
            onToggle={dayPlan.toggleCompleted}
            onOpenActions={planSheets.openMealActions}
            onAddSlot={planSheets.openAddSlot}
            onQuickAdd={planSheets.openQuickAdd}
            onDayActions={planSheets.openDayActions}
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

      {planSheets.sheets}
      {planSheets.toast}
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
