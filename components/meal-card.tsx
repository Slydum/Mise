"use client";

import Link from "next/link";
import { Check, Clock, Flame } from "lucide-react";
import type { Recipe } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MealCardProps {
  recipe: Recipe;
  completed?: boolean;
  onToggleCompleted?: () => void;
  className?: string;
}

/**
 * A planned meal row: emoji artwork, title, time + calories, and a large
 * "mark as eaten" toggle. The whole card links to the recipe.
 */
export function MealCard({ recipe, completed = false, onToggleCompleted, className }: MealCardProps) {
  const totalMinutes = recipe.prepMinutes + recipe.cookMinutes;

  return (
    <div
      className={cn(
        "relative flex items-center gap-4 rounded-3xl border border-border/60 bg-card p-3 pr-4 shadow-[0_1px_3px_rgba(43,41,37,0.05)] transition-all duration-200",
        completed && "opacity-70",
        className,
      )}
    >
      <Link
        href={`/recipes/${recipe.id}`}
        className="flex min-w-0 flex-1 items-center gap-4 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span
          aria-hidden
          className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-accent text-3xl"
        >
          {recipe.emoji}
        </span>
        <span className="min-w-0">
          <span
            className={cn(
              "block truncate text-base font-semibold leading-snug",
              completed && "line-through decoration-muted-foreground/60",
            )}
          >
            {recipe.title}
          </span>
          <span className="mt-0.5 flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" aria-hidden />
              {totalMinutes} min
            </span>
            <span className="flex items-center gap-1">
              <Flame className="size-3.5" aria-hidden />
              {recipe.nutrition.calories} cal
            </span>
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
            "flex size-11 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-90",
            completed
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-transparent",
          )}
        >
          <Check className="size-5" strokeWidth={3} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
