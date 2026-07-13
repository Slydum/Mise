import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CookMode } from "@/components/cook/cook-mode";
import { getRecipe, getRecipes } from "@/lib/data";

interface CookPageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const recipes = await getRecipes();
  return recipes.map(({ id }) => ({ id }));
}

export async function generateMetadata({ params }: CookPageProps): Promise<Metadata> {
  const { id } = await params;
  const recipe = await getRecipe(id);
  return { title: recipe ? `Cooking ${recipe.title} — Mise` : "Cooking — Mise" };
}

export default async function CookPage({ params }: CookPageProps) {
  const { id } = await params;
  const recipe = await getRecipe(id);
  if (!recipe) notFound();

  return <CookMode recipe={recipe} />;
}
