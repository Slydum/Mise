"use client";

import Link from "next/link";
import { ArrowRight, TriangleAlert } from "lucide-react";
import { findDietCompatibleReplacement, isRecipeDietCompatible, recipeContainsAnyIngredient } from "@/lib/diet";
import { useDietaryStyle } from "@/lib/hooks/use-dietary-style";
import { useFoodPreferences } from "@/lib/hooks/use-food-preferences";
import type { Recipe } from "@/lib/types";
import { DIETARY_STYLE_LABELS } from "@/lib/types";

interface DietWarningProps {
  recipe: Recipe;
  allRecipes: Recipe[];
}

/**
 * Flags a recipe that conflicts with the user's chosen eating style or an
 * ingredient they've flagged as an allergy/exclusion, and offers a
 * compatible swap. Renders nothing when the recipe is a clean match.
 */
export function DietWarning({ recipe, allRecipes }: DietWarningProps) {
  const { dietaryStyle } = useDietaryStyle();
  const { allergies, excludedIngredients } = useFoodPreferences();

  const dietCompatible = isRecipeDietCompatible(recipe, dietaryStyle);
  const allergyMatch = recipeContainsAnyIngredient(recipe, allergies);
  const excludedMatch = !allergyMatch ? recipeContainsAnyIngredient(recipe, excludedIngredients) : null;

  if (dietCompatible && !allergyMatch && !excludedMatch) return null;

  const replacement = !dietCompatible
    ? findDietCompatibleReplacement(recipe, allRecipes, dietaryStyle)
    : null;

  return (
    <div className="flex flex-col gap-2 rounded-3xl border border-highlight/30 bg-highlight-tint p-4">
      <p className="flex items-start gap-2 text-sm font-medium text-highlight-tint-foreground">
        <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
        {!dietCompatible
          ? `This recipe isn't ${DIETARY_STYLE_LABELS[dietaryStyle].toLowerCase()}-friendly.`
          : allergyMatch
            ? `Contains "${allergyMatch}", which you've flagged as an allergy.`
            : `Contains "${excludedMatch}", which is on your excluded list.`}
      </p>
      {replacement ? (
        <Link
          href={`/recipes/${replacement.id}`}
          className="flex items-center gap-1.5 self-start rounded-full bg-card px-3.5 py-2 text-sm font-semibold text-highlight outline-none transition-transform duration-150 focus-visible:ring-2 focus-visible:ring-ring active:scale-95"
        >
          Try {replacement.title} instead
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}
