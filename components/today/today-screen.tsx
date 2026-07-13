"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { MealCard } from "@/components/meal-card";
import { NutritionSummary } from "@/components/today/nutrition-summary";
import { QuickAddSheet } from "@/components/quick-add-sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { getDayPlan, getProfile, getRecipes } from "@/lib/data";
import {
  addExtraMeal,
  loadCompletedMeals,
  loadExtraMeals,
  saveCompletedMeals,
} from "@/lib/data/local-store";
import { formatLongDate, greeting, todayKey } from "@/lib/dates";
import { useData } from "@/lib/hooks/use-data";
import type { MealType, Nutrition, PlannedMeal, Recipe } from "@/lib/types";
import { MEAL_TYPES, MEAL_TYPE_LABELS } from "@/lib/types";

const EMPTY_NUTRITION: Nutrition = { calories: 0, protein: 0, carbs: 0, fat: 0 };

export function TodayScreen() {
  // Date is resolved on the client so the statically cached page never
  // shows a stale day.
  const [dateKey] = useState(todayKey);

  const recipes = useData(getRecipes);
  const profile = useData(getProfile);
  const loadPlan = useCallback(() => getDayPlan(dateKey), [dateKey]);
  const plan = useData(loadPlan);

  const [extras, setExtras] = useState<PlannedMeal[]>([]);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  // localStorage is client-only; hydrate persisted state after mount so the
  // server-rendered HTML always matches the first client render.
  useEffect(() => {
    setExtras(loadExtraMeals(dateKey));
    setCompleted(loadCompletedMeals());
  }, [dateKey]);

  const recipeById = useMemo(
    () => new Map((recipes ?? []).map((r) => [r.id, r])),
    [recipes],
  );

  const allMeals = useMemo(
    () => [...(plan?.meals ?? []), ...extras],
    [plan, extras],
  );

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

  const loading = !plan || !recipes || !profile;

  return (
    <div className="flex flex-col gap-6 px-5 pt-4 animate-fade-up">
      <header>
        {/* Date and greeting are computed at render time, so the statically
            prerendered HTML can differ from the client — suppress the
            one-off text patch. */}
        <p suppressHydrationWarning className="text-sm font-medium text-muted-foreground">
          {formatLongDate(new Date())}
        </p>
        <h1 suppressHydrationWarning className="text-3xl font-bold tracking-tight">
          {greeting()}
          {profile ? `, ${profile.name}` : ""}
        </h1>
      </header>

      {loading ? (
        <TodaySkeleton />
      ) : (
        <>
          <NutritionSummary consumed={consumed} goals={profile.goals} />

          {MEAL_TYPES.map((mealType) => {
            const meals = allMeals.filter((m) => m.mealType === mealType);
            if (meals.length === 0) return null;
            return (
              <section key={mealType} aria-label={MEAL_TYPE_LABELS[mealType]}>
                <h2 className="mb-2 px-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {MEAL_TYPE_LABELS[mealType]}
                </h2>
                <div className="flex flex-col gap-3">
                  {meals.map((meal) => {
                    const recipe = recipeById.get(meal.recipeId);
                    if (!recipe) return null;
                    return (
                      <MealCard
                        key={meal.id}
                        recipe={recipe}
                        completed={Boolean(completed[meal.id])}
                        onToggleCompleted={() => toggleCompleted(meal.id)}
                      />
                    );
                  })}
                </div>
              </section>
            );
          })}
        </>
      )}

      <button
        type="button"
        onClick={() => setQuickAddOpen(true)}
        aria-label="Quick add a meal"
        className="fixed bottom-24 right-5 z-30 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-90"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        <Plus className="size-7" aria-hidden />
      </button>

      <QuickAddSheet
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
        onAdd={handleQuickAdd}
      />
    </div>
  );
}

function TodaySkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden>
      <Skeleton className="h-48 rounded-3xl" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-20 rounded-3xl" />
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-20 rounded-3xl" />
      </div>
    </div>
  );
}
