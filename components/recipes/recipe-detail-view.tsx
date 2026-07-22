"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarPlus, ChefHat, Clock, ShoppingBasket } from "lucide-react";
import { AddToPlanSheet } from "@/components/recipes/add-to-plan-sheet";
import { DietWarning } from "@/components/recipes/diet-warning";
import { IngredientChecklist } from "@/components/recipes/ingredient-checklist";
import { RecipeHero } from "@/components/recipes/recipe-hero";
import { ServingsStepper } from "@/components/recipes/servings-stepper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { addGroceryItems } from "@/lib/data/local-store";
import { useDietaryStyle } from "@/lib/hooks/use-dietary-style";
import { useToast } from "@/lib/hooks/use-toast";
import type { GroceryItem, MealType, Recipe } from "@/lib/types";
import { CUSTOM_RECIPE_ID_PREFIX, MEAL_TYPE_LABELS, RECIPE_TAG_LABELS } from "@/lib/types";

interface RecipeDetailViewProps {
  recipe: Recipe;
  allRecipes: Recipe[];
}

/** Full recipe detail: hero, servings-scaled ingredients, per-serving nutrition, add-to-plan/grocery, steps. */
export function RecipeDetailView({ recipe, allRecipes }: RecipeDetailViewProps) {
  const { dietaryStyle } = useDietaryStyle();
  const { message: toastMessage, showToast } = useToast();
  const [servings, setServings] = useState(recipe.servings);
  const [addToPlanOpen, setAddToPlanOpen] = useState(false);

  const scale = servings / recipe.servings;
  const hasIngredients = recipe.ingredients.length > 0;
  const hasSteps = recipe.steps.length > 0;
  const isCustom = recipe.id.startsWith(CUSTOM_RECIPE_ID_PREFIX);
  const cookHref = isCustom ? `/cook/custom?id=${recipe.id}` : `/cook/${recipe.id}`;

  // recipe.nutrition is always per single serving (see recipe-card.tsx and
  // today-screen.tsx, which both read it unscaled) — the servings stepper
  // changes how much to cook/buy, not what one serving contains, so it must
  // never multiply these values.
  const nutritionChips = [
    { label: "Calories", value: Math.round(recipe.nutrition.calories) },
    { label: "Protein", value: `${Math.round(recipe.nutrition.protein)}g` },
    { label: "Carbs", value: `${Math.round(recipe.nutrition.carbs)}g` },
    { label: "Fat", value: `${Math.round(recipe.nutrition.fat)}g` },
  ];

  const handleAddToGrocery = () => {
    const items: GroceryItem[] = recipe.ingredients.map((ingredient, index) => ({
      id: `extra-${recipe.id}-${ingredient.id}-${Date.now()}-${index}`,
      name: ingredient.name,
      amount: ingredient.amount * scale,
      unit: ingredient.unit,
      category: ingredient.category,
    }));
    addGroceryItems(items);
    showToast("Added to grocery list");
  };

  const handleAdded = (mealType: MealType) => {
    showToast(`Added to ${MEAL_TYPE_LABELS[mealType].toLowerCase()}`);
  };

  return (
    <div className="flex flex-col gap-6 pb-2 animate-fade-up">
      <RecipeHero recipe={recipe} />

      <div className="flex flex-col gap-6 px-5">
        <header className="flex flex-col gap-2.5">
          <h1 className="font-serif text-4xl leading-tight">{recipe.title}</h1>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="size-4" aria-hidden />
              {recipe.prepMinutes + recipe.cookMinutes} min
            </span>
            <ServingsStepper value={servings} onChange={setServings} />
          </p>
          <p className="leading-relaxed text-foreground/80">{recipe.description}</p>
          {recipe.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {recipe.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {RECIPE_TAG_LABELS[tag]}
                </Badge>
              ))}
            </div>
          ) : null}
        </header>

        <DietWarning recipe={recipe} allRecipes={allRecipes} />

        <div className="flex flex-col gap-2.5">
          {hasSteps ? (
            <Button asChild variant="highlight" size="lg" className="w-full">
              <Link href={cookHref}>
                <ChefHat aria-hidden />
                Cook
              </Link>
            </Button>
          ) : null}
          <div className="grid grid-cols-2 gap-2.5">
            <Button variant="outline" size="lg" onClick={() => setAddToPlanOpen(true)}>
              <CalendarPlus aria-hidden />
              Add to plan
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleAddToGrocery}
              disabled={!hasIngredients}
            >
              <ShoppingBasket aria-hidden />
              Add to grocery
            </Button>
          </div>
        </div>

        <div
          className="flex gap-2.5 overflow-x-auto no-scrollbar"
          role="list"
          aria-label="Nutrition per serving"
        >
          {nutritionChips.map(({ label, value }) => (
            <div
              key={label}
              role="listitem"
              className="flex shrink-0 flex-col items-center gap-0.5 rounded-2xl bg-accent px-5 py-3 text-accent-foreground"
            >
              <span className="text-base font-semibold leading-none">{value}</span>
              <span className="text-[11px] font-medium uppercase tracking-wide opacity-70">
                {label}
              </span>
            </div>
          ))}
        </div>

        {hasIngredients ? (
          <section>
            <h2 className="mb-1 font-serif text-2xl">Ingredients</h2>
            <IngredientChecklist recipeId={recipe.id} ingredients={recipe.ingredients} scale={scale} />
          </section>
        ) : null}

        {hasSteps ? (
          <section>
            <h2 className="mb-2 font-serif text-2xl">Steps</h2>
            <ol className="flex flex-col gap-4">
              {recipe.steps.map((step, index) => (
                <li key={step.id} className="flex gap-3">
                  <span
                    aria-hidden
                    className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground"
                  >
                    {index + 1}
                  </span>
                  <p className="pt-0.5 leading-relaxed">{step.instruction}</p>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
      </div>

      <AddToPlanSheet
        open={addToPlanOpen}
        onOpenChange={setAddToPlanOpen}
        recipeId={recipe.id}
        dietaryStyle={dietaryStyle}
        onAdded={handleAdded}
      />
      <Toast message={toastMessage} />
    </div>
  );
}
