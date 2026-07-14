"use client";

import { useEffect, useState } from "react";
import { ArrowRightLeft, ChevronLeft, Copy, Repeat, Trash2, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { DaySelector } from "@/components/plan/day-selector";
import { MealTypeEyebrow } from "@/components/meal-type-eyebrow";
import { SheetActionRow } from "@/components/sheet-action-row";
import { resolveDayMeals, type ResolvedMeal } from "@/lib/data/plan-overrides";
import { addDays, formatShortDate, fromDateKey, toDateKey, todayKey } from "@/lib/dates";
import type { UseDayPlanResult } from "@/lib/hooks/use-day-plan";
import type { DietaryStyle, MealType } from "@/lib/types";
import { MEAL_TYPE_LABELS, MEAL_TYPES } from "@/lib/types";

interface MealActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meal: ResolvedMeal | null;
  dayPlan: UseDayPlanResult;
  dietaryStyle: DietaryStyle;
  /** Sheet closes itself, then hands off to the parent to open QuickAddSheet in replace mode. */
  onRequestReplace: (meal: ResolvedMeal) => void;
  onToast: (message: string) => void;
}

type View = "menu" | { mode: "copy" | "move" };

function relativeDayLabel(dateKey: string): string {
  const todayK = todayKey();
  if (dateKey === todayK) return "Today";
  if (dateKey === toDateKey(addDays(fromDateKey(todayK), 1))) return "Tomorrow";
  return formatShortDate(fromDateKey(dateKey));
}

/** Replace / copy / move / save-as-leftovers / remove for a single planned meal. */
export function MealActionSheet({
  open,
  onOpenChange,
  meal,
  dayPlan,
  dietaryStyle,
  onRequestReplace,
  onToast,
}: MealActionSheetProps) {
  const [view, setView] = useState<View>("menu");

  // Reset to the menu each time the sheet (re)opens for a (possibly new) meal.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setView("menu");
  }

  if (!meal) return null;

  const canSaveLeftover = meal.mealType === "dinner" && meal.completed;

  const handleRemove = () => {
    dayPlan.removeMeal(meal);
    onToast("Removed");
    onOpenChange(false);
  };

  const handleSaveLeftover = async () => {
    const { placedDirectly } = await dayPlan.markLeftover(meal);
    onToast(
      placedDirectly
        ? "Saved as tomorrow's lunch"
        : "Saved as leftovers — use it anytime from + → Use leftovers",
    );
    onOpenChange(false);
  };

  const handleReplace = () => {
    onOpenChange(false);
    onRequestReplace(meal);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        {view === "menu" ? (
          <div className="flex flex-col pb-6">
            <SheetTitle>{meal.recipe.title}</SheetTitle>
            <SheetDescription>
              {MEAL_TYPE_LABELS[meal.mealType]} · {relativeDayLabel(meal.date)}
            </SheetDescription>
            <div className="mt-3 flex flex-col px-2">
              <SheetActionRow icon={Repeat} label="Replace" onClick={handleReplace} />
              <SheetActionRow
                icon={Copy}
                label="Copy to another day"
                onClick={() => setView({ mode: "copy" })}
                showChevron
              />
              <SheetActionRow
                icon={ArrowRightLeft}
                label="Move to another day"
                onClick={() => setView({ mode: "move" })}
                showChevron
              />
              {canSaveLeftover ? (
                <SheetActionRow
                  icon={UtensilsCrossed}
                  label="Save as tomorrow's lunch"
                  onClick={handleSaveLeftover}
                />
              ) : null}
              <SheetActionRow icon={Trash2} label="Remove" onClick={handleRemove} destructive />
            </div>
          </div>
        ) : (
          <DestinationView
            meal={meal}
            mode={view.mode}
            dietaryStyle={dietaryStyle}
            onBack={() => setView("menu")}
            onPick={async (toDate, toMealType, replaceExisting) => {
              const mode = view.mode;
              if (mode === "copy") {
                await dayPlan.copyMealTo(meal, toDate, toMealType, { replaceExisting });
                onToast(`Copied to ${relativeDayLabel(toDate)}`);
              } else {
                await dayPlan.moveMealTo(meal, toDate, toMealType, { replaceExisting });
                onToast(`Moved to ${relativeDayLabel(toDate)}`);
              }
              onOpenChange(false);
            }}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

interface DestinationViewProps {
  meal: ResolvedMeal;
  mode: "copy" | "move";
  dietaryStyle: DietaryStyle;
  onBack: () => void;
  onPick: (toDate: string, toMealType: MealType, replaceExisting: boolean) => void;
}

const DESTINATION_DAYS = 7;

function DestinationView({ meal, mode, dietaryStyle, onBack, onPick }: DestinationViewProps) {
  const [dateKeys] = useState(() => {
    const start = fromDateKey(todayKey());
    return Array.from({ length: DESTINATION_DAYS }, (_, i) => toDateKey(addDays(start, i)));
  });
  const [destDate, setDestDate] = useState(dateKeys[0]);
  const [destMeals, setDestMeals] = useState<ResolvedMeal[] | null>(null);

  useEffect(() => {
    let active = true;
    setDestMeals(null);
    resolveDayMeals(destDate, dietaryStyle).then((resolved) => {
      if (active) setDestMeals(resolved);
    });
    return () => {
      active = false;
    };
  }, [destDate, dietaryStyle]);

  return (
    <div className="flex flex-col pb-6">
      <div className="flex items-center gap-1 px-4 pt-2">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back">
          <ChevronLeft className="size-5" aria-hidden />
        </Button>
        <SheetTitle className="px-0 pt-0">
          {mode === "copy" ? "Copy to another day" : "Move to another day"}
        </SheetTitle>
      </div>

      <DaySelector dateKeys={dateKeys} selected={destDate} onSelect={setDestDate} />

      <div className="flex flex-col gap-2 overflow-y-auto px-5 pt-2">
        {MEAL_TYPES.map((mealType) => {
          const occupant = destMeals?.find((m) => m.mealType === mealType);
          const isSameSlot = destDate === meal.date && mealType === meal.mealType;
          return (
            <div
              key={mealType}
              className="flex items-center gap-2 rounded-2xl border border-border/60 px-4 py-3"
            >
              <button
                type="button"
                disabled={isSameSlot}
                onClick={() => onPick(destDate, mealType, false)}
                className="min-w-0 flex-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
              >
                <MealTypeEyebrow mealType={mealType} />
                <span className="block truncate font-serif text-base">
                  {isSameSlot
                    ? "This meal's current slot"
                    : occupant
                      ? occupant.recipe.title
                      : "Empty — tap to fill"}
                </span>
              </button>
              {occupant && !isSameSlot ? (
                <button
                  type="button"
                  onClick={() => onPick(destDate, mealType, true)}
                  className="shrink-0 text-xs font-medium text-highlight outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Replace
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
