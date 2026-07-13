import Link from "next/link";
import { FoodCover } from "@/components/food-cover";
import type { Recipe } from "@/lib/types";

interface DiscoveryRailProps {
  title: string;
  recipes: Recipe[];
  className?: string;
}

/** Horizontal, Pinterest-style rail of recipe covers for browsing/discovery. */
export function DiscoveryRail({ title, recipes, className }: DiscoveryRailProps) {
  if (recipes.length === 0) return null;

  return (
    <section aria-label={title} className={className}>
      <h2 className="mb-3 px-5 font-serif text-2xl">{title}</h2>
      <div className="flex gap-4 overflow-x-auto px-5 pb-1 no-scrollbar">
        {recipes.map((recipe) => (
          <Link
            key={recipe.id}
            href={`/recipes/${recipe.id}`}
            className="w-36 shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-3xl"
          >
            <FoodCover
              recipe={recipe}
              aspect="portrait"
              rounded="rounded-3xl"
              emojiClassName="text-4xl"
              className="shadow-soft transition-transform duration-200 active:scale-[0.96]"
            />
            <p className="mt-2 line-clamp-2 font-serif text-base leading-snug">{recipe.title}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
