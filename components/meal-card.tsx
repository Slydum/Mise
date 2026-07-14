"use client";

import Link from "next/link";
import { MoreVertical } from "lucide-react";
import { FoodCover } from "@/components/food-cover";
import { MealTypeEyebrow } from "@/components/meal-type-eyebrow";
import { Checkbox } from "@/components/ui/checkbox";
import type { MealType, Recipe } from "@/lib/types";
import { CUSTOM_RECIPE_ID_PREFIX, hasRecipeContent } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MealCardProps {
  recipe: Recipe;
  mealType: MealType;
  completed?: boolean;
  onToggleCompleted?: () => void;
  /** Opens the replace/copy/move/remove action sheet for this meal. */
  onOpenActions?: () => void;
  className?: string;
}

/**
 * A single row in a meal menu: cover thumbnail, meal-type eyebrow, recipe
 * title, an optional "eaten" checkbox, and an optional overflow trigger for
 * the meal-action sheet. Used on Today's Menu and the Plan screen.
 */
export function MealCard({
  recipe,
  mealType,
  completed = false,
  onToggleCompleted,
  onOpenActions,
  className,
}: MealCardProps) {
  const isCustom = recipe.id.startsWith(CUSTOM_RECIPE_ID_PREFIX);
  // A name-only "Add custom meal" quick-add has nothing to show on a detail
  // page, so it opens the action sheet directly; a custom recipe with real
  // ingredients/steps gets a real (query-param routed) detail page like a
  // catalog recipe — see app/(tabs)/recipes/custom/page.tsx.
  const hasDetail = !isCustom || hasRecipeContent(recipe);
  const detailHref = isCustom ? `/recipes/custom?id=${recipe.id}` : `/recipes/${recipe.id}`;

  const thumbnail = (
    <>
      <FoodCover
        recipe={recipe}
        aspect="square"
        rounded="rounded-2xl"
        emojiClassName="text-2xl"
        className="size-14 shrink-0 shadow-soft"
      />
      <span className="min-w-0 flex-1">
        <MealTypeEyebrow mealType={mealType} />
        <span
          className={cn(
            "block line-clamp-2 font-serif text-lg leading-snug",
            completed && "text-muted-foreground line-through decoration-muted-foreground/60",
          )}
        >
          {recipe.title}
        </span>
      </span>
    </>
  );

  return (
    <div className={cn("relative flex items-center gap-4 py-2.5", className)}>
      {hasDetail ? (
        <Link
          href={detailHref}
          className="flex min-w-0 flex-1 items-center gap-4 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {thumbnail}
        </Link>
      ) : (
        <button
          type="button"
          onClick={onOpenActions}
          className="flex min-w-0 flex-1 items-center gap-4 rounded-2xl text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {thumbnail}
        </button>
      )}

      {onToggleCompleted ? (
        <span className="flex size-11 shrink-0 items-center justify-center">
          <Checkbox
            checked={completed}
            onCheckedChange={onToggleCompleted}
            aria-label={completed ? `Mark ${recipe.title} as not eaten` : `Mark ${recipe.title} as eaten`}
            className="size-7"
          />
        </span>
      ) : null}

      {onOpenActions && hasDetail ? (
        <button
          type="button"
          onClick={onOpenActions}
          aria-label={`Options for ${recipe.title}`}
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring active:bg-muted"
        >
          <MoreVertical className="size-4.5" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
