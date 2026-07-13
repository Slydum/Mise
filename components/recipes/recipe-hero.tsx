"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { FavoriteButton } from "@/components/favorite-button";
import { FoodCover } from "@/components/food-cover";
import { useFavorites } from "@/lib/hooks/use-favorites";
import type { Recipe } from "@/lib/types";

interface RecipeHeroProps {
  recipe: Recipe;
}

/** Large hero cover with floating back and save actions, cookbook-cover style. */
export function RecipeHero({ recipe }: RecipeHeroProps) {
  const { favorites, setFavorite } = useFavorites();

  return (
    <div className="relative">
      <FoodCover
        recipe={recipe}
        aspect="hero"
        rounded="rounded-none"
        emojiClassName="text-8xl"
        className="w-full"
      />
      <Link
        href="/recipes"
        aria-label="Back to recipes"
        className="absolute left-4 top-4 flex size-11 items-center justify-center rounded-full bg-card/90 text-foreground shadow-sm backdrop-blur outline-none transition-transform duration-150 focus-visible:ring-2 focus-visible:ring-ring active:scale-90"
      >
        <ChevronLeft aria-hidden />
      </Link>
      <FavoriteButton
        recipeId={recipe.id}
        recipeTitle={recipe.title}
        active={Boolean(favorites[recipe.id])}
        onToggle={(active) => setFavorite(recipe.id, active)}
        size="md"
        className="absolute right-4 top-4"
      />
    </div>
  );
}
