"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { resolveDayMeals, type ResolvedMeal } from "@/lib/data/plan-overrides";
import { addDays, formatWeekdayShort, fromDateKey, isToday, toDateKey } from "@/lib/dates";
import type { DietaryStyle } from "@/lib/types";
import { MEAL_TYPE_EMOJI, MEAL_TYPES } from "@/lib/types";
import { cn } from "@/lib/utils";

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatMonthDay(date: Date): string {
  return `${MONTHS_SHORT[date.getMonth()]} ${date.getDate()}`;
}

interface WeekOverviewProps {
  /** Sunday of the displayed week, YYYY-MM-DD. */
  weekStartKey: string;
  dietaryStyle: DietaryStyle;
  onSelectDay: (dateKey: string) => void;
  onChangeWeekStart: (weekStartKey: string) => void;
}

/** Compact 7-day glance: filled/empty meal-type glyphs per day, no full meal cards. */
export function WeekOverview({
  weekStartKey,
  dietaryStyle,
  onSelectDay,
  onChangeWeekStart,
}: WeekOverviewProps) {
  const dateKeys = useMemo(() => {
    const start = fromDateKey(weekStartKey);
    return Array.from({ length: 7 }, (_, i) => toDateKey(addDays(start, i)));
  }, [weekStartKey]);

  const [mealsByDate, setMealsByDate] = useState<Record<string, ResolvedMeal[]>>({});

  useEffect(() => {
    let active = true;
    Promise.all(
      dateKeys.map((key) => resolveDayMeals(key, dietaryStyle).then((meals) => [key, meals] as const)),
    ).then((entries) => {
      if (active) setMealsByDate(Object.fromEntries(entries));
    });
    return () => {
      active = false;
    };
  }, [dateKeys, dietaryStyle]);

  const handlePrev = () => onChangeWeekStart(toDateKey(addDays(fromDateKey(weekStartKey), -7)));
  const handleNext = () => onChangeWeekStart(toDateKey(addDays(fromDateKey(weekStartKey), 7)));

  return (
    <div className="px-5">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous week"
          className="flex size-9 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring active:bg-muted"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </button>
        <p className="text-sm font-medium text-muted-foreground">
          {formatMonthDay(fromDateKey(dateKeys[0]))} – {formatMonthDay(fromDateKey(dateKeys[6]))}
        </p>
        <button
          type="button"
          onClick={handleNext}
          aria-label="Next week"
          className="flex size-9 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring active:bg-muted"
        >
          <ChevronRight className="size-5" aria-hidden />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {dateKeys.map((key) => {
          const date = fromDateKey(key);
          const meals = mealsByDate[key] ?? [];
          const filledTypes = new Set(meals.map((m) => m.mealType));
          const today = isToday(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDay(key)}
              aria-label={`${formatWeekdayShort(date)} ${date.getDate()}, ${meals.length} meal${meals.length === 1 ? "" : "s"} planned`}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-2xl py-3 outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring active:bg-muted",
                today && "bg-highlight-tint",
              )}
            >
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {formatWeekdayShort(date)}
              </span>
              <span className="font-serif text-base leading-none">{date.getDate()}</span>
              <span aria-hidden className="flex flex-col items-center gap-0.5">
                {MEAL_TYPES.map((mealType) => (
                  <span
                    key={mealType}
                    className={cn(
                      "text-[10px] leading-none",
                      filledTypes.has(mealType) ? "opacity-100" : "opacity-20 grayscale",
                    )}
                  >
                    {MEAL_TYPE_EMOJI[mealType]}
                  </span>
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
