import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RecipeDetailView } from "@/components/recipes/recipe-detail-view";
import { getRecipe, getRecipes } from "@/lib/data";

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

  return <RecipeDetailView recipe={recipe} allRecipes={allRecipes} />;
}
