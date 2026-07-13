import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChefHat, ChevronLeft, Clock, Flame, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const recipe = await getRecipe(id);
  if (!recipe) notFound();

  const facts = [
    { icon: Clock, label: `${recipe.prepMinutes + recipe.cookMinutes} min` },
    { icon: Flame, label: `${recipe.nutrition.calories} cal` },
    { icon: Users, label: `Serves ${recipe.servings}` },
  ];

  return (
    <div className="flex flex-col gap-5 animate-fade-up">
      <div className="relative flex h-44 items-center justify-center bg-accent">
        <span className="text-7xl" aria-hidden>
          {recipe.emoji}
        </span>
        <Button
          asChild
          variant="outline"
          size="icon"
          className="absolute left-4 top-4 shadow-sm"
        >
          <Link href="/recipes" aria-label="Back to recipes">
            <ChevronLeft aria-hidden />
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-5 px-5">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">{recipe.title}</h1>
          <p className="text-muted-foreground">{recipe.description}</p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {recipe.tags.map((tag) => (
              <Badge key={tag}>{RECIPE_TAG_LABELS[tag]}</Badge>
            ))}
          </div>
        </header>

        <div className="grid grid-cols-3 gap-3" role="list" aria-label="Recipe facts">
          {facts.map(({ icon: Icon, label }) => (
            <div
              key={label}
              role="listitem"
              className="flex flex-col items-center gap-1 rounded-2xl bg-card border border-border/60 py-3"
            >
              <Icon className="size-5 text-primary" aria-hidden />
              <span className="text-sm font-semibold">{label}</span>
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ingredients</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col divide-y divide-border/60">
              {recipe.ingredients.map((ingredient) => (
                <li key={ingredient.id} className="flex items-baseline justify-between gap-4 py-2.5">
                  <span>{ingredient.name}</span>
                  <span className="shrink-0 text-sm font-medium text-muted-foreground">
                    {ingredient.quantity}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="flex flex-col gap-4">
              {recipe.steps.map((step, index) => (
                <li key={step.id} className="flex gap-3">
                  <span
                    aria-hidden
                    className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground"
                  >
                    {index + 1}
                  </span>
                  <p className="pt-0.5 leading-relaxed">{step.instruction}</p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Button asChild size="lg" className="w-full">
          <Link href={`/cook/${recipe.id}`}>
            <ChefHat aria-hidden />
            Start cooking
          </Link>
        </Button>
      </div>
    </div>
  );
}
