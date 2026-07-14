"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CookMode } from "@/components/cook/cook-mode";
import { Skeleton } from "@/components/ui/skeleton";
import { loadCustomRecipes } from "@/lib/data/local-store";
import type { Recipe } from "@/lib/types";

/** Cook mode for a user-created recipe, addressed by `?id=` — see app/(tabs)/recipes/custom/page.tsx for why. */
function CustomCookContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [recipe, setRecipe] = useState<Recipe | null | undefined>(undefined);

  useEffect(() => {
    if (!id) {
      setRecipe(null);
      return;
    }
    setRecipe(loadCustomRecipes()[id] ?? null);
  }, [id]);

  if (recipe === undefined) {
    return <Skeleton className="m-5 h-64 rounded-3xl" aria-hidden />;
  }

  if (!recipe) {
    return (
      <div className="flex flex-col items-center gap-3 px-5 py-20 text-center">
        <p className="font-serif text-xl">Recipe not found</p>
        <Link href="/recipes" className="text-sm font-semibold text-highlight">
          Back to Recipes
        </Link>
      </div>
    );
  }

  return <CookMode recipe={recipe} />;
}

export default function CustomCookPage() {
  return (
    <Suspense fallback={<Skeleton className="m-5 h-64 rounded-3xl" aria-hidden />}>
      <CustomCookContent />
    </Suspense>
  );
}
