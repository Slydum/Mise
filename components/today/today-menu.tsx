"use client";

import { Plus } from "lucide-react";
import { MealCard } from "@/components/meal-card";
import { MealTypeEyebrow } from "@/components/meal-type-eyebrow";
import type { MealType, Recipe } from "@/lib/types";
import { MEAL_TYPES } from "@/lib/types";

export interface TodayMenuEntry {
  id: string;
  mealType: MealType;
  recipe: Recipe;
  completed: boolean;
}

interface TodayMenuProps {
  entries: TodayMenuEntry[];
  onToggle: (mealId: string) => void;
  onAddSlot: (mealType: MealType) => void;
  onQuickAdd: () => void;
}

/** Today's meals as one continuous, editorial menu rather than a stack of stat cards. */
export function TodayMenu({ entries, onToggle, onAddSlot, onQuickAdd }: TodayMenuProps) {
  const byType = new Map<MealType, TodayMenuEntry[]>();
  for (const entry of entries) {
    byType.set(entry.mealType, [...(byType.get(entry.mealType) ?? []), entry]);
  }

  return (
    <section aria-label="Today's menu" className="px-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-serif text-2xl">Today&apos;s Menu</h2>
        <button
          type="button"
          onClick={onQuickAdd}
          aria-label="Quick add a meal"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-highlight text-highlight-foreground shadow-soft transition-transform duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-90"
        >
          <Plus className="size-4.5" aria-hidden />
        </button>
      </div>
      <div className="divide-y divide-border/60 rounded-3xl border border-border/60 bg-card px-5 shadow-soft">
        {MEAL_TYPES.map((mealType) => {
          const mealEntries = byType.get(mealType) ?? [];
          if (mealEntries.length === 0) {
            return (
              <button
                key={mealType}
                type="button"
                onClick={() => onAddSlot(mealType)}
                className="flex w-full items-center gap-4 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span
                  aria-hidden
                  className="flex size-14 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-border text-xl text-muted-foreground"
                >
                  <Plus className="size-5" aria-hidden />
                </span>
                <span>
                  <MealTypeEyebrow mealType={mealType} />
                  <span className="block font-serif text-lg text-muted-foreground">
                    Add {mealType}
                  </span>
                </span>
              </button>
            );
          }
          return mealEntries.map((entry) => (
            <MealCard
              key={entry.id}
              recipe={entry.recipe}
              mealType={entry.mealType}
              completed={entry.completed}
              onToggleCompleted={() => onToggle(entry.id)}
            />
          ));
        })}
      </div>
    </section>
  );
}
