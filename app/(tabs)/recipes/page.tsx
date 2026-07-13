import type { Metadata } from "next";
import { RecipesScreen } from "@/components/recipes/recipes-screen";

export const metadata: Metadata = {
  title: "Recipes — Mise",
};

export default function RecipesPage() {
  return <RecipesScreen />;
}
