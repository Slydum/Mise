"use client";

import { Heart } from "lucide-react";
import { toggleFavorite } from "@/lib/data/local-store";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  recipeId: string;
  recipeTitle: string;
  active: boolean;
  onToggle: (active: boolean) => void;
  className?: string;
  size?: "sm" | "md";
}

/** Small heart toggle for saving a recipe to the cookbook. */
export function FavoriteButton({
  recipeId,
  recipeTitle,
  active,
  onToggle,
  className,
  size = "sm",
}: FavoriteButtonProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const next = toggleFavorite(recipeId);
        onToggle(Boolean(next[recipeId]));
      }}
      aria-pressed={active}
      aria-label={active ? `Remove ${recipeTitle} from saved recipes` : `Save ${recipeTitle}`}
      className={cn(
        "flex items-center justify-center rounded-full bg-card/90 text-highlight shadow-sm backdrop-blur transition-transform duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-90",
        size === "sm" ? "size-9 [&_svg]:size-4" : "size-11 [&_svg]:size-5",
        className,
      )}
    >
      <Heart className={cn(active && "fill-highlight")} aria-hidden />
    </button>
  );
}
