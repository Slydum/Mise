"use client";

import { useEffect, useMemo, useState } from "react";
import { LayoutGrid, List, MoreHorizontal, Plus } from "lucide-react";
import { DaySelector } from "@/components/plan/day-selector";
import { WeekOverview } from "@/components/plan/week-overview";
import { MealCard } from "@/components/meal-card";
import { MealTypeEyebrow } from "@/components/meal-type-eyebrow";
import { ScreenHeader } from "@/components/screen-header";
import { Skeleton } from "@/components/ui/skeleton";
import { addDays, formatShortDate, fromDateKey, isToday, toDateKey, todayKey } from "@/lib/dates";
import { useDayPlan } from "@/lib/hooks/use-day-plan";
import { useDietaryStyle } from "@/lib/hooks/use-dietary-style";
import { useFoodPreferences } from "@/lib/hooks/use-food-preferences";
import { usePlanSheets } from "@/lib/hooks/use-plan-sheets";
import { MEAL_TYPES } from "@/lib/types";
import { cn } from "@/lib/utils";

const DAYS_SHOWN = 14;

function startOfWeekKey(dateKey: string): string {
  const date = fromDateKey(dateKey);
  return toDateKey(addDays(date, -date.getDay()));
}

export function PlanScreen() {
  // "Today" is resolved after mount: the page is statically prerendered, so
  // computing dates during render would bake in the build date and mismatch
  // on hydration.
  const [start, setStart] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"day" | "week">("day");
  const [weekStartKey, setWeekStartKey] = useState<string | null>(null);

  useEffect(() => {
    const key = todayKey();
    setStart(key);
    setSelected((prev) => prev ?? key);
    setWeekStartKey((prev) => prev ?? startOfWeekKey(key));
  }, []);

  const dateKeys = useMemo(() => {
    if (!start) return [];
    const startDate = fromDateKey(start);
    return Array.from({ length: DAYS_SHOWN }, (_, i) => toDateKey(addDays(startDate, i)));
  }, [start]);

  const { dietaryStyle } = useDietaryStyle();
  const { allergies, excludedIngredients, favoriteIngredients } = useFoodPreferences();
  const avoidTerms = useMemo(
    () => [...allergies, ...excludedIngredients],
    [allergies, excludedIngredients],
  );

  const dayPlan = useDayPlan(selected, dietaryStyle);

  const planSheets = usePlanSheets({
    dateKey: selected,
    dayPlan,
    dietaryStyle,
    avoidTerms,
    boostTerms: favoriteIngredients,
  });

  const handleSelectFromWeek = (dateKey: string) => {
    setSelected(dateKey);
    setViewMode("day");
  };

  const loading = dayPlan.loading || !selected;

  return (
    <div className="flex flex-col gap-3 animate-fade-up">
      <ScreenHeader
        title="Plan"
        subtitle={
          !selected || isToday(selected) ? "Your week" : formatShortDate(fromDateKey(selected))
        }
      />

      <div className="flex items-center justify-between px-5">
        <div role="tablist" aria-label="Plan view" className="flex gap-1 rounded-full bg-muted p-1">
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "day"}
            onClick={() => setViewMode("day")}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring",
              viewMode === "day" ? "bg-card shadow-sm" : "text-muted-foreground",
            )}
          >
            <List className="size-3.5" aria-hidden />
            Day
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "week"}
            onClick={() => {
              if (selected) setWeekStartKey(startOfWeekKey(selected));
              setViewMode("week");
            }}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring",
              viewMode === "week" ? "bg-card shadow-sm" : "text-muted-foreground",
            )}
          >
            <LayoutGrid className="size-3.5" aria-hidden />
            Week
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={planSheets.openDayActions}
            aria-label="Day options"
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring active:bg-muted"
          >
            <MoreHorizontal className="size-4.5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={planSheets.openQuickAdd}
            aria-label="Quick add a meal"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-highlight text-highlight-foreground shadow-soft transition-transform duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-90"
          >
            <Plus className="size-4.5" aria-hidden />
          </button>
        </div>
      </div>

      {viewMode === "week" ? (
        weekStartKey ? (
          <WeekOverview
            weekStartKey={weekStartKey}
            dietaryStyle={dietaryStyle}
            onSelectDay={handleSelectFromWeek}
            onChangeWeekStart={setWeekStartKey}
          />
        ) : null
      ) : (
        <>
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
                  const meals = dayPlan.meals.filter((m) => m.mealType === mealType);
                  return (
                    <div key={mealType} className="py-2.5">
                      {meals.length === 0 ? (
                        <button
                          type="button"
                          onClick={() => planSheets.openAddSlot(mealType)}
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
                        meals.map((meal) => (
                          <MealCard
                            key={meal.id}
                            recipe={meal.recipe}
                            mealType={mealType}
                            completed={meal.completed}
                            onToggleCompleted={() => dayPlan.toggleCompleted(meal.id)}
                            onOpenActions={() => planSheets.openMealActions(meal)}
                          />
                        ))
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {planSheets.sheets}
      {planSheets.toast}
    </div>
  );
}

function PlanSkeleton() {
  return <Skeleton className="h-80 rounded-3xl" aria-hidden />;
}
