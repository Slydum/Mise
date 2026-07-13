import { cn } from "@/lib/utils";
import type { Recipe } from "@/lib/types";

/**
 * Cover art for a recipe. Renders `recipe.imageUrl` when present; otherwise
 * falls back to a deterministic, art-directed gradient + emoji mark so every
 * recipe still gets a distinct, editorial-feeling "cover" before real
 * photography is wired in (see lib/types.ts Recipe.imageUrl).
 */

const GRADIENTS = [
  "from-[#f4e3c8] to-[#e3bd8d]", // toasted sand
  "from-[#ecdfc2] to-[#cdb689]", // wheat
  "from-[#ecdad0] to-[#d8ab8c]", // clay
  "from-[#e4e8d5] to-[#bfc9a4]", // sage mist
  "from-[#f1ddce] to-[#dda183]", // terracotta blush
  "from-[#e9e1d0] to-[#c7b78f]", // linen
  "from-[#dfe6df] to-[#a9baa8]", // eucalyptus
];

function coverIndex(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash + id.charCodeAt(i) * (i + 1)) % GRADIENTS.length;
  return hash;
}

const ASPECT = {
  square: "aspect-square",
  portrait: "aspect-[4/5]",
  wide: "aspect-[16/10]",
  hero: "aspect-[4/3]",
} as const;

interface FoodCoverProps {
  recipe: Pick<Recipe, "id" | "emoji" | "imageUrl" | "title">;
  aspect?: keyof typeof ASPECT;
  rounded?: string;
  emojiClassName?: string;
  className?: string;
}

export function FoodCover({
  recipe,
  aspect = "square",
  rounded = "rounded-3xl",
  emojiClassName,
  className,
}: FoodCoverProps) {
  if (recipe.imageUrl) {
    return (
      <div className={cn("relative overflow-hidden", ASPECT[aspect], rounded, className)}>
        <img
          src={recipe.imageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
        />
      </div>
    );
  }

  const gradient = GRADIENTS[coverIndex(recipe.id)];
  return (
    <div
      aria-hidden
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-gradient-to-br",
        gradient,
        ASPECT[aspect],
        rounded,
        className,
      )}
    >
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(circle at 30% 22%, rgba(255,255,255,0.5), transparent 55%), radial-gradient(circle at 78% 85%, rgba(0,0,0,0.12), transparent 60%)",
        }}
      />
      <span
        className={cn(
          "relative drop-shadow-[0_6px_14px_rgba(44,38,30,0.18)]",
          emojiClassName ?? "text-5xl",
        )}
      >
        {recipe.emoji}
      </span>
    </div>
  );
}
