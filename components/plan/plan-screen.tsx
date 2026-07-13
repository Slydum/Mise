"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { DaySelector } from "@/components/plan/day-selector";
import { MealCard } from "@/components/meal-card";
import { MealTypeEyebrow } from "@/components/meal-type-eyebrow";
import { QuickAddSheet } from "@/components/quick-add-sheet";
import { ScreenHeader } from "@/components/screen-header";
import { Skeleton } from "@/components/ui/skeleton";
import { getDayPlan, getRecipes } from "@/lib/data";
import { addExtraMeal, loadExtraMeals } from "@/lib/data/local-store";
import { addDays, formatShortDate, fromDateKey, isToday, toDateKey, todayKey } from "@/lib/dates";
import { useData } from "@/lib/hooks/use-data";
import { useDietaryStyle } from "@/lib/hooks/use-dietary-style";
import type { MealType, PlannedMeal, Recipe } from "@/lib/types";
import { MEAL_TYPES } from "@/lib/types";

const DAYS_SHOWN = 14;

export function PlanScreen() {
  // "Today" is resolved after mount: the page is statically prerendered, so
  // computing dates during render would bake in the build date and mismatch
  // on hydration.
  const [start, setStart] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const key = todayKey();
    setStart(key);
    setSelected((prev) => prev ?? key);
  }, []);

  const dateKeys = useMemo(() => {
    if (!start) return [];
    const startDate = fromDateKey(start);
    return Array.from({ length: DAYS_SHOWN }, (_, i) => toDateKey(addDays(startDate, i)));
  }, [start]);

  const [extras, setExtras] = useState<PlannedMeal[]>([]);
  const [quickAdd, setQuickAdd] = useState<{ open: boolean; mealType?: MealType }>({
    open: false,
  });

  const { dietaryStyle } = useDietaryStyle();
  const recipes = useData(getRecipes);
  const loadPlan = useCallback(
    () => (selected ? getDayPlan(selected, dietaryStyle) : Promise.resolve(null)),
    [selected, dietaryStyle],
  );
  const plan = useData(loadPlan);

  useEffect(() => {
    if (selected) setExtras(loadExtraMeals(selected));
  }, [selected]);

  const recipeById = useMemo(
    () => new Map((recipes ?? []).map((r) => [r.id, r])),
    [recipes],
  );

  const handleAdd = (mealType: MealType, recipe: Recipe) => {
    if (!selected) return;
    const meal = addExtraMeal(selected, mealType, recipe.id);
    setExtras((prev) => [...prev, meal]);
  };

  const loading = !plan || !recipes || !selected;

  return (
    <div className="flex flex-col gap-3 animate-fade-up">
      <ScreenHeader
        title="Plan"
        subtitle={
          !selected || isToday(selected) ? "Your week" : formatShortDate(fromDateKey(selected))
        }
      />

      {selected ? (
        <DaySelector dateKeys={dateKeys} selected={selected} onSelect={setSelected} />
      ) : (
        <div className="flex gap-2 px-5 py-1" aria-hidden>
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-12 rounded-2xl" />
          ))}
        </div>
      )}

      <div className="px-5 pt-2">
        {loading ? (
          <PlanSkeleton />
        ) : (
          <div className="divide-y divide-border/60 rounded-3xl border border-border/60 bg-card px-5 shadow-soft">
            {MEAL_TYPES.map((mealType) => {
              const meals = [...plan.meals, ...extras].filter((m) => m.mealType === mealType);
              return (
                <div key={mealType} className="py-2.5">
                  {meals.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => setQuickAdd({ open: true, mealType })}
                      className="flex w-full items-center gap-4 py-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span
                        aria-hidden
                        className="flex size-14 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-border text-muted-foreground"
                      >
                        <Plus className="size-5" aria-hidden />
                      </span>
                      <span>
                        <MealTypeEyebrow mealType={mealType} />
                        <span className="block font-serif text-lg text-muted-foreground">
                          Browse recipes to add {mealType}
                        </span>
                      </span>
                    </button>
                  ) : (
                    meals.map((meal) => {
                      const recipe = recipeById.get(meal.recipeId);
                      return recipe ? (
                        <MealCard key={meal.id} recipe={recipe} mealType={mealType} />
                      ) : null;
                    })
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <QuickAddSheet
        open={quickAdd.open}
        onOpenChange={(open) => setQuickAdd((prev) => ({ ...prev, open }))}
        initialMealType={quickAdd.mealType}
        onAdd={handleAdd}
      />
    </div>
  );
}

function PlanSkeleton() {
  return <Skeleton className="h-80 rounded-3xl" aria-hidden />;
}
