"use client";

import Link from "next/link";
import { Clock } from "lucide-react";
import { FavoriteButton } from "@/components/favorite-button";
import { FoodCover } from "@/components/food-cover";
import { Badge } from "@/components/ui/badge";
import type { Recipe } from "@/lib/types";
import { RECIPE_TAG_LABELS } from "@/lib/types";

interface RecipeCardProps {
  recipe: Recipe;
  favorited: boolean;
  onToggleFavorite: (active: boolean) => void;
}

/** Photography-forward recipe tile for the browse grid — Pinterest-style. */
export function RecipeCard({ recipe, favorited, onToggleFavorite }: RecipeCardProps) {
  const tag = recipe.tags[0];

  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="group flex flex-col outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-3xl"
    >
      <div className="relative">
        <FoodCover
          recipe={recipe}
          aspect="portrait"
          rounded="rounded-3xl"
          emojiClassName="text-5xl"
          className="shadow-soft transition-transform duration-200 group-active:scale-[0.97]"
        />
        <FavoriteButton
          recipeId={recipe.id}
          recipeTitle={recipe.title}
          active={favorited}
          onToggle={onToggleFavorite}
          className="absolute right-2.5 top-2.5"
        />
        {tag ? (
          <Badge variant="highlight" className="absolute bottom-2.5 left-2.5 shadow-sm">
            {RECIPE_TAG_LABELS[tag]}
          </Badge>
        ) : null}
      </div>
      <div className="flex flex-col gap-1 px-1 pt-3">
        <h3 className="line-clamp-2 font-serif text-lg leading-snug">{recipe.title}</h3>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="size-3.5" aria-hidden />
          {recipe.prepMinutes + recipe.cookMinutes} min · {recipe.nutrition.calories} cal
        </span>
      </div>
    </Link>
  );
}
