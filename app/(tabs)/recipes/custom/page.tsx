"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { RecipeDetailView } from "@/components/recipes/recipe-detail-view";
import { Skeleton } from "@/components/ui/skeleton";
import { getRecipes } from "@/lib/data";
import { loadCustomRecipes } from "@/lib/data/local-store";
import { useData } from "@/lib/hooks/use-data";
import type { Recipe } from "@/lib/types";

/**
 * Detail view for a user-created recipe, addressed by `?id=` rather than a
 * path segment: the app is a fully static export, so a per-id route can only
 * exist for the catalog ids known at build time (see /recipes/[id]). This
 * single static page works for any custom id, including on a hard refresh.
 */
function CustomRecipeContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const allRecipes = useData(getRecipes);
  const [recipe, setRecipe] = useState<Recipe | null | undefined>(undefined);

  useEffect(() => {
    if (!id) {
      setRecipe(null);
      return;
    }
    setRecipe(loadCustomRecipes()[id] ?? null);
  }, [id]);

  if (recipe === undefined || !allRecipes) {
    return (
      <div className="flex flex-col gap-6 px-5 pt-5" aria-hidden>
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-24 rounded-3xl" />
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="flex flex-col items-center gap-3 px-5 py-20 text-center">
        <span className="text-4xl" aria-hidden>
          🔍
        </span>
        <p className="font-serif text-xl">Recipe not found</p>
        <p className="text-sm text-muted-foreground">It may have been removed.</p>
        <Link href="/recipes" className="text-sm font-semibold text-highlight">
          Back to Recipes
        </Link>
      </div>
    );
  }

  return <RecipeDetailView recipe={recipe} allRecipes={allRecipes} />;
}

export default function CustomRecipePage() {
  return (
    <Suspense fallback={<Skeleton className="m-5 h-64 rounded-3xl" aria-hidden />}>
      <CustomRecipeContent />
    </Suspense>
  );
}
