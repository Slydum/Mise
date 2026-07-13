import Link from "next/link";
import { Clock, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Recipe } from "@/lib/types";
import { RECIPE_TAG_LABELS } from "@/lib/types";

interface RecipeCardProps {
  recipe: Recipe;
}

/** Tappable recipe tile for the 2-column browse grid. */
export function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="group flex flex-col overflow-hidden rounded-3xl border border-border/60 bg-card shadow-[0_1px_3px_rgba(43,41,37,0.05)] transition-transform duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
    >
      <div
        aria-hidden
        className="flex h-28 items-center justify-center bg-accent text-5xl"
      >
        {recipe.emoji}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 font-semibold leading-snug">{recipe.title}</h3>
        <div className="mt-auto flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden />
            {recipe.prepMinutes + recipe.cookMinutes} min
          </span>
          <span className="flex items-center gap-1">
            <Flame className="size-3.5" aria-hidden />
            {recipe.nutrition.calories}
          </span>
        </div>
        {recipe.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {recipe.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="muted" className="px-2 py-0.5 text-[10px]">
                {RECIPE_TAG_LABELS[tag]}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
