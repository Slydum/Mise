import type { Metadata } from "next";
import { RecipeForm } from "@/components/recipes/recipe-form";

export const metadata: Metadata = { title: "New Recipe — Mise" };

export default function NewRecipePage() {
  return <RecipeForm />;
}
