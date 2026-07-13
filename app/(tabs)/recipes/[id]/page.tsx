import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChefHat, Clock, Users } from "lucide-react";
import { DietWarning } from "@/components/recipes/diet-warning";
import { IngredientChecklist } from "@/components/recipes/ingredient-checklist";
import { RecipeHero } from "@/components/recipes/recipe-hero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getRecipe, getRecipes } from "@/lib/data";
import { RECIPE_TAG_LABELS } from "@/lib/types";

interface RecipePageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const recipes = await getRecipes();
  return recipes.map(({ id }) => ({ id }));
}

export async function generateMetadata({ params }: RecipePageProps): Promise<Metadata> {
  const { id } = await params;
  const recipe = await getRecipe(id);
  return { title: recipe ? `${recipe.title} — Mise` : "Recipe — Mise" };
}

export default async function RecipePage({ params }: RecipePageProps) {
  const { id } = await params;
  const [recipe, allRecipes] = await Promise.all([getRecipe(id), getRecipes()]);
  if (!recipe) notFound();

  const nutritionChips = [
    { label: "Calories", value: recipe.nutrition.calories },
    { label: "Protein", value: `${recipe.nutrition.protein}g` },
    { label: "Carbs", value: `${recipe.nutrition.carbs}g` },
    { label: "Fat", value: `${recipe.nutrition.fat}g` },
  ];

  return (
    <div className="flex flex-col gap-6 pb-2 animate-fade-up">
      <RecipeHero recipe={recipe} />

      <div className="flex flex-col gap-6 px-5">
        <header className="flex flex-col gap-2.5">
          <h1 className="font-serif text-4xl leading-tight">{recipe.title}</h1>
          <p className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="size-4" aria-hidden />
              {recipe.prepMinutes + recipe.cookMinutes} min
            </span>
            <span className="flex items-center gap-1">
              <Users className="size-4" aria-hidden />
              Serves {recipe.servings}
            </span>
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

        <Button asChild variant="highlight" size="lg" className="w-full">
          <Link href={`/cook/${recipe.id}`}>
            <ChefHat aria-hidden />
            Cook
          </Link>
        </Button>

        <div className="flex gap-2.5 overflow-x-auto no-scrollbar" role="list" aria-label="Nutrition per serving">
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

        <section>
          <h2 className="mb-1 font-serif text-2xl">Ingredients</h2>
          <IngredientChecklist recipeId={recipe.id} ingredients={recipe.ingredients} />
        </section>

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
      </div>
    </div>
  );
}
