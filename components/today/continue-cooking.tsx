import Link from "next/link";
import { ChefHat, ChevronRight } from "lucide-react";
import { FoodCover } from "@/components/food-cover";
import type { Recipe } from "@/lib/types";

interface ContinueCookingProps {
  recipe: Recipe;
  stepIndex: number;
}

/** Surfaces an in-progress cook session so it's one tap to pick back up. */
export function ContinueCooking({ recipe, stepIndex }: ContinueCookingProps) {
  return (
    <section className="px-5">
      <Link
        href={`/cook/${recipe.id}`}
        className="flex items-center gap-4 rounded-3xl bg-highlight-tint p-4 pr-5 shadow-soft outline-none transition-transform duration-150 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"
      >
        <FoodCover
          recipe={recipe}
          aspect="square"
          rounded="rounded-2xl"
          emojiClassName="text-2xl"
          className="size-14 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-highlight-tint-foreground/80">
            <ChefHat className="size-3.5" aria-hidden />
            Continue cooking
          </p>
          <p className="line-clamp-2 font-serif text-lg leading-snug text-highlight-tint-foreground">
            {recipe.title}
          </p>
          <p className="text-xs text-highlight-tint-foreground/70">
            Step {stepIndex + 1} of {recipe.steps.length}
          </p>
        </div>
        <ChevronRight className="size-5 shrink-0 text-highlight-tint-foreground/60" aria-hidden />
      </Link>
    </section>
  );
}
