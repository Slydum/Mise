"use client";

import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { loadIngredientChecks, saveIngredientChecks } from "@/lib/data/local-store";
import { formatQuantity } from "@/lib/ingredients";
import type { Ingredient } from "@/lib/types";
import { cn } from "@/lib/utils";

interface IngredientChecklistProps {
  recipeId: string;
  ingredients: Ingredient[];
  /** Servings scaling factor (e.g. 1.5 for 6 servings on a 4-serving recipe). Defaults to 1. */
  scale?: number;
}

/** Tappable ingredient list — handy for checking off what's already on hand while prepping. */
export function IngredientChecklist({ recipeId, ingredients, scale = 1 }: IngredientChecklistProps) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setChecked(loadIngredientChecks(recipeId));
  }, [recipeId]);

  const toggle = (ingredientId: string) => {
    setChecked((prev) => {
      const next = { ...prev, [ingredientId]: !prev[ingredientId] };
      saveIngredientChecks(recipeId, next);
      return next;
    });
  };

  return (
    <ul className="flex flex-col divide-y divide-border/60">
      {ingredients.map((ingredient) => {
        const isChecked = Boolean(checked[ingredient.id]);
        const quantity = formatQuantity(ingredient.amount * scale, ingredient.unit);
        return (
          <li key={ingredient.id}>
            <label className="flex min-h-12 cursor-pointer items-center gap-3.5 py-2.5">
              <Checkbox
                checked={isChecked}
                onCheckedChange={() => toggle(ingredient.id)}
                aria-label={`${ingredient.name}, ${quantity}`}
              />
              <span
                className={cn(
                  "flex-1 transition-colors duration-150",
                  isChecked && "text-muted-foreground line-through decoration-muted-foreground/60",
                )}
              >
                {ingredient.name}
              </span>
              <span className="shrink-0 text-sm font-medium text-muted-foreground">
                {quantity}
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
