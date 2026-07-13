"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { FoodCover } from "@/components/food-cover";
import { MealTypeEyebrow } from "@/components/meal-type-eyebrow";
import type { MealType, Recipe } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MealCardProps {
  recipe: Recipe;
  mealType: MealType;
  completed?: boolean;
  onToggleCompleted?: () => void;
  className?: string;
}

/**
 * A single row in a meal menu: cover thumbnail, meal-type eyebrow, recipe
 * title, and an optional tap-to-check "eaten" toggle. Used on Today's Menu
 * and the Plan screen.
 */
export function MealCard({ recipe, mealType, completed = false, onToggleCompleted, className }: MealCardProps) {
  return (
    <div className={cn("relative flex items-center gap-4 py-2.5", className)}>
      <Link
        href={`/recipes/${recipe.id}`}
        className="flex min-w-0 flex-1 items-center gap-4 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <FoodCover
          recipe={recipe}
          aspect="square"
          rounded="rounded-2xl"
          emojiClassName="text-2xl"
          className="size-14 shrink-0 shadow-soft"
        />
        <span className="min-w-0">
          <MealTypeEyebrow mealType={mealType} />
          <span
            className={cn(
              "block truncate font-serif text-lg leading-snug",
              completed && "text-muted-foreground line-through decoration-muted-foreground/60",
            )}
          >
            {recipe.title}
          </span>
        </span>
      </Link>

      {onToggleCompleted ? (
        <button
          type="button"
          onClick={onToggleCompleted}
          aria-label={completed ? `Mark ${recipe.title} as not eaten` : `Mark ${recipe.title} as eaten`}
          aria-pressed={completed}
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-90",
            completed
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-transparent",
          )}
        >
          <Check className="size-4" strokeWidth={3} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
