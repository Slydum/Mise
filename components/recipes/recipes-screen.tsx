"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { RecipeCard } from "@/components/recipes/recipe-card";
import { ScreenHeader } from "@/components/screen-header";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getRecipes } from "@/lib/data";
import { useData } from "@/lib/hooks/use-data";
import { useDietaryStyle } from "@/lib/hooks/use-dietary-style";
import { useFavorites } from "@/lib/hooks/use-favorites";
import type { MealType, Recipe, RecipeTag } from "@/lib/types";
import { MEAL_TYPE_LABELS, RECIPE_TAG_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

type Filter =
  | { kind: "all" }
  | { kind: "saved" }
  | { kind: "meal"; value: MealType }
  | { kind: "tag"; value: RecipeTag };

const FILTERS: { id: string; label: string; filter: Filter }[] = [
  { id: "all", label: "All", filter: { kind: "all" } },
  { id: "saved", label: "Saved", filter: { kind: "saved" } },
  { id: "breakfast", label: MEAL_TYPE_LABELS.breakfast, filter: { kind: "meal", value: "breakfast" } },
  { id: "lunch", label: MEAL_TYPE_LABELS.lunch, filter: { kind: "meal", value: "lunch" } },
  { id: "dinner", label: MEAL_TYPE_LABELS.dinner, filter: { kind: "meal", value: "dinner" } },
  { id: "snack", label: MEAL_TYPE_LABELS.snack, filter: { kind: "meal", value: "snack" } },
  { id: "quick", label: RECIPE_TAG_LABELS.quick, filter: { kind: "tag", value: "quick" } },
  { id: "vegetarian", label: RECIPE_TAG_LABELS.vegetarian, filter: { kind: "tag", value: "vegetarian" } },
  { id: "high-protein", label: RECIPE_TAG_LABELS["high-protein"], filter: { kind: "tag", value: "high-protein" } },
];

function matches(recipe: Recipe, filter: Filter, query: string, favorites: Record<string, boolean>): boolean {
  if (filter.kind === "saved" && !favorites[recipe.id]) return false;
  if (filter.kind === "meal" && !recipe.mealTypes.includes(filter.value)) return false;
  if (filter.kind === "tag" && !recipe.tags.includes(filter.value)) return false;
  if (query) {
    const haystack = `${recipe.title} ${recipe.description} ${recipe.ingredients
      .map((i) => i.name)
      .join(" ")}`.toLowerCase();
    return haystack.includes(query.toLowerCase().trim());
  }
  return true;
}

export function RecipesScreen() {
  const recipes = useData(getRecipes);
  const { favorites, setFavorite } = useFavorites();
  const { dietaryStyle } = useDietaryStyle();
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const filtered = useMemo(() => {
    if (!recipes) return null;
    const filter = FILTERS.find((f) => f.id === activeFilter)?.filter ?? { kind: "all" as const };
    return recipes.filter((r) => matches(r, filter, query, favorites));
  }, [recipes, activeFilter, query, favorites]);

  return (
    <div className="flex flex-col gap-5 animate-fade-up">
      <ScreenHeader title="Recipes" subtitle="Your cookbook" />

      <div className="relative px-5">
        <Search
          className="pointer-events-none absolute left-9 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          inputMode="search"
          placeholder="Search recipes or ingredients"
          aria-label="Search recipes"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-12"
        />
      </div>

      <div
        role="radiogroup"
        aria-label="Filter recipes"
        className="flex gap-2 overflow-x-auto px-5 pb-1 no-scrollbar"
      >
        {FILTERS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={activeFilter === id}
            onClick={() => setActiveFilter(id)}
            className={cn(
              "h-10 shrink-0 rounded-full px-4 text-sm font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95",
              activeFilter === id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "border border-border/60 bg-card text-muted-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {!filtered ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 px-5" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="aspect-[4/5] rounded-3xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-5 py-16 text-center">
          <span className="text-4xl" aria-hidden>
            🍽️
          </span>
          <p className="font-serif text-lg">No recipes found</p>
          <p className="text-sm text-muted-foreground">
            Try a different search or clear the filters.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-6 px-5">
          {filtered.map((recipe) => (
            <li key={recipe.id} className="contents">
              <RecipeCard
                recipe={recipe}
                favorited={Boolean(favorites[recipe.id])}
                onToggleFavorite={(active) => setFavorite(recipe.id, active)}
                dietaryStyle={dietaryStyle}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
